// ============================================================
// Socket.io Game Server
// ============================================================
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  GameState, Player, RoomSettings, DEFAULT_SETTINGS,
} from '../src/lib/types';
import {
  generateRoomCode, createGameState, generateBoard,
  generateBonusCards, toClientState, toClientCard,
  startRound, processGuess, checkBonusTrigger,
  endRound, isGameOver, getGameStats,
} from '../src/lib/engine';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 5000,
  pingTimeout: 10000,
});

// Health check endpoint to keep Render awake
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// In-memory state
const rooms = new Map<string, GameState>();
const playerRooms = new Map<string, string>(); // socketId -> roomCode
const activeCards = new Map<string, string>(); // roomCode -> cardId
const timers = new Map<string, NodeJS.Timeout>();
const guessTimestamps = new Map<string, number[]>(); // socketId -> timestamps for rate limiting

function getRoom(code: string): GameState | undefined {
  return rooms.get(code.toUpperCase());
}

function broadcastState(roomCode: string) {
  const state = getRoom(roomCode);
  if (!state) return;
  io.to(roomCode).emit('room:state', toClientState(state));
}

function startTimer(roomCode: string) {
  const existing = timers.get(roomCode);
  if (existing) clearInterval(existing);

  const interval = setInterval(() => {
    try {
      const state = getRoom(roomCode);
      if (!state || state.status !== 'playing') {
        clearInterval(interval);
        timers.delete(roomCode);
        return;
      }
      state.timeRemaining -= 1;
      io.to(roomCode).emit('timer:tick', state.timeRemaining);

      if (state.timeRemaining <= 15 && state.timeRemaining > 0) {
        io.to(roomCode).emit('timer:urgent');
      }

      // --- Bot Logic ---
      if (state.currentRound) {
        const activeCardId = activeCards.get(roomCode);
        const isBotDescriber = state.currentRound.describerId.startsWith('bot_');

        // 1. Bot Describer logic: Select a random unsolved card if none is selected
        if (isBotDescriber && !activeCardId) {
          const unsolvedCards = state.board.filter(c => !c.solved);
          if (unsolvedCards.length > 0) {
            // Pick a random card
            const randomCard = unsolvedCards[Math.floor(Math.random() * unsolvedCards.length)];
            activeCards.set(roomCode, randomCard.id);
            state.currentRound.cardsAttempted += 1;
            io.to(roomCode).emit('card:selected', randomCard.id);
          }
        }

        // 2. Bot Guesser logic: Occasionally guess the right word
        if (activeCardId) {
          const card = state.board.find(c => c.id === activeCardId);
          if (card && Math.random() < 0.15) { // 15% chance per second to guess correctly
            // Find a bot on the active team that is NOT the describer
            const currentTeam = state.teams[state.currentRound.teamIndex];
            const guessingBots = currentTeam.players.filter(p => 
              p.id.startsWith('bot_') && p.id !== state.currentRound!.describerId
            );

            if (guessingBots.length > 0) {
              const bot = guessingBots[Math.floor(Math.random() * guessingBots.length)];
              
              const result = processGuess(
                state, card.id, card.wordEntry.word, bot.id, bot.name, bot.teamIndex
              );
              
              if (result) {
                bot.guessCount += 1;
                if (result.result !== 'wrong') bot.correctGuesses += 1;
                io.to(roomCode).emit('guess:result', result);

                if (result.result === 'correct') {
                  io.to(roomCode).emit('card:solved', {
                    cardId: card.id, points: result.points, teamIndex: bot.teamIndex, difficulty: card.difficulty,
                  });
                  io.to(roomCode).emit('score:update', state.teams);
                  io.to(roomCode).emit('board:updated', state.board.map(toClientCard));

                  io.to(roomCode).emit('streak:update', { count: currentTeam.streak, teamIndex: bot.teamIndex });
                  if (currentTeam.streak >= 3) {
                    io.to(roomCode).emit('combo:trigger', { level: Math.min(currentTeam.streak - 2, 5), teamIndex: bot.teamIndex });
                  }

                  activeCards.delete(roomCode);

                  if (checkBonusTrigger(state, bot.teamIndex)) {
                    const usedIds = state.board.map(c => c.wordEntry.id);
                    const bonusCards = generateBonusCards(state, state.settings.bonusBatchSize, usedIds);
                    state.board.push(...bonusCards);
                    state.currentRound!.bonusCardsGenerated += bonusCards.length;
                    io.to(roomCode).emit('bonus:generated', bonusCards.map(toClientCard));
                    io.to(roomCode).emit('board:updated', state.board.map(toClientCard));
                  }

                  if (state.board.every(c => c.solved)) {
                    handleRoundEnd(roomCode);
                  }
                }
              }
            }
          }
        }
      }
      // --- End Bot Logic ---

      if (state.timeRemaining <= 0) {
        clearInterval(interval);
        timers.delete(roomCode);
        handleRoundEnd(roomCode);
      }
    } catch (err) {
      console.error('[Timer Error]', err);
    }
  }, 1000);

  timers.set(roomCode, interval);
}

function handleRoundEnd(roomCode: string) {
  const state = getRoom(roomCode);
  if (!state) return;

  const summary = endRound(state);
  if (summary) {
    io.to(roomCode).emit('round:end', summary);
  }

  if (isGameOver(state)) {
    state.status = 'game_over';
    const winner = state.teams.reduce((best, t) => t.score > best.score ? t : best);
    io.to(roomCode).emit('game:over', {
      teams: state.teams,
      winner: winner.index,
      stats: getGameStats(state),
    });
  }
}

function rateLimit(socketId: string): boolean {
  const now = Date.now();
  let timestamps = guessTimestamps.get(socketId) || [];
  timestamps = timestamps.filter(t => now - t < 1000); // last 1s
  if (timestamps.length >= 5) return true; // blocked
  timestamps.push(now);
  guessTimestamps.set(socketId, timestamps);
  return false;
}

io.on('connection', (socket: Socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── CREATE ROOM ──
  socket.on('room:create', (settings: Partial<RoomSettings>, playerName: string) => {
    const code = generateRoomCode();
    const state = createGameState(code, settings);
    const player: Player = {
      id: socket.id,
      name: playerName || 'Host',
      teamIndex: 0,
      isHost: true,
      isConnected: true,
      guessCount: 0,
      correctGuesses: 0,
    };
    state.teams[0].players.push(player);
    state.teams[0].describerQueue.push(player.id);
    rooms.set(code, state);
    playerRooms.set(socket.id, code);
    socket.join(code);
    socket.emit('room:state', toClientState(state));
    console.log(`[Room] Created: ${code} by ${playerName}`);
  });

  // ── JOIN ROOM ──
  socket.on('room:join', (code: string, playerName: string) => {
    const roomCode = code.toUpperCase();
    const state = getRoom(roomCode);
    if (!state) {
      socket.emit('room:error', 'Room not found');
      return;
    }
    if (state.status !== 'lobby') {
      socket.emit('room:error', 'Game already in progress');
      return;
    }
    // Find team with fewest players
    const team = state.teams.reduce((min, t) =>
      t.players.length < min.players.length ? t : min
    );
    if (team.players.length >= state.settings.maxPlayersPerTeam) {
      socket.emit('room:error', 'Room is full');
      return;
    }
    const player: Player = {
      id: socket.id,
      name: playerName || `Player ${socket.id.slice(0, 4)}`,
      teamIndex: team.index,
      isHost: false,
      isConnected: true,
      guessCount: 0,
      correctGuesses: 0,
    };
    team.players.push(player);
    team.describerQueue.push(player.id);
    playerRooms.set(socket.id, roomCode);
    socket.join(roomCode);
    io.to(roomCode).emit('room:playerJoined', player);
    broadcastState(roomCode);
    console.log(`[Room] ${playerName} joined ${roomCode}`);
  });

  // ── TEAM JOIN ──
  socket.on('team:join', (teamIndex: number) => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'lobby') return;

    // Save player data before removing
    let savedName = '';
    let savedIsHost = false;
    for (const team of state.teams) {
      const existing = team.players.find(p => p.id === socket.id);
      if (existing) {
        savedName = existing.name;
        savedIsHost = existing.isHost;
        break;
      }
    }

    // Remove from current team
    for (const team of state.teams) {
      const idx = team.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        team.players.splice(idx, 1);
        team.describerQueue = team.describerQueue.filter(id => id !== socket.id);
      }
    }
    // Add to new team
    const targetTeam = state.teams[teamIndex];
    if (!targetTeam || targetTeam.players.length >= state.settings.maxPlayersPerTeam) return;
    const player: Player = {
      id: socket.id,
      name: savedName || `Player ${socket.id.slice(0, 4)}`,
      teamIndex,
      isHost: savedIsHost,
      isConnected: true,
      guessCount: 0,
      correctGuesses: 0,
    };
    targetTeam.players.push(player);
    targetTeam.describerQueue.push(player.id);
    broadcastState(roomCode);
  });

  // ── SETTINGS UPDATE ──
  socket.on('settings:update', (newSettings: Partial<RoomSettings>) => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'lobby') return;
    // Only host can update
    const host = state.teams.flatMap(t => t.players).find(p => p.id === socket.id && p.isHost);
    if (!host) return;
    state.settings = { ...state.settings, ...newSettings };
    if (newSettings.teamCount && newSettings.teamCount !== state.teams.length) {
      while (state.teams.length < newSettings.teamCount) {
        const i = state.teams.length;
        state.teams.push({
          index: i,
          name: ['Team Alpha', 'Team Bravo', 'Team Charlie'][i] || `Team ${i + 1}`,
          color: ['#00f0ff', '#ff2d7c', '#ffd600'][i] || '#ffffff',
          players: [], score: 0, roundScore: 0, solvedCards: 0, streak: 0, maxStreak: 0, describerQueue: [],
        });
      }
      while (state.teams.length > newSettings.teamCount) state.teams.pop();
    }
    state.totalRounds = state.settings.totalRounds;
    broadcastState(roomCode);
  });

  // ── START GAME ──
  socket.on('game:start', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'lobby') return;
    const host = state.teams.flatMap(t => t.players).find(p => p.id === socket.id && p.isHost);
    if (!host) return;
    // Need at least 1 player per team
    if (state.teams.some(t => t.players.length < 1)) {
      socket.emit('room:error', 'Each team needs at least 1 player');
      return;
    }
    state.board = generateBoard(state);
    const round = startRound(state);
    io.to(roomCode).emit('game:started', toClientState(state));
    io.to(roomCode).emit('round:start', round, state.board.map(toClientCard));

    // Send word to describer
    const describerSocket = io.sockets.sockets.get(round.describerId);
    if (describerSocket) {
      // Describer sees all words on the board
    }
    startTimer(roomCode);
  });

  // ── CARD SELECT (describer only) ──
  socket.on('card:select', (cardId: string) => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'playing' || !state.currentRound) return;
    if (state.currentRound.describerId !== socket.id) return;

    const card = state.board.find(c => c.id === cardId && !c.solved);
    if (!card) return;
    activeCards.set(roomCode, cardId);
    state.currentRound.cardsAttempted += 1;

    // Broadcast to room that a card is selected (Everyone sees what is being described)
    io.to(roomCode).emit('card:selected', cardId);
    // Send word + taboo words to describer only
    socket.emit('card:word', {
      word: card.wordEntry.word,
      tabooWords: card.wordEntry.tabooWords,
    });
  });

  // ── CARD DESELECT (describer only) ──
  socket.on('card:deselect', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'playing' || !state.currentRound) return;
    if (state.currentRound.describerId !== socket.id) return;

    activeCards.delete(roomCode);
    
    // Broadcast to room that no card is selected
    io.to(roomCode).emit('card:selected', null);
    io.to(roomCode).emit('card:word', { word: null, tabooWords: [] });
  });

  // ── GUESS SUBMIT ──
  socket.on('guess:submit', (text: string) => {
    if (!text || text.trim().length === 0 || text.length > 50) return;
    if (rateLimit(socket.id)) return;

    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'playing' || !state.currentRound) return;

    const cardId = activeCards.get(roomCode);
    if (!cardId) return;

    const card = state.board.find(c => c.id === cardId);
    if (!card) return;

    // Find player
    const player = state.teams.flatMap(t => t.players).find(p => p.id === socket.id);
    if (!player) return;

    const result = processGuess(
      state, cardId, text.trim(), socket.id, player.name, player.teamIndex
    );
    if (!result) return;

    player.guessCount += 1;
    if (result.result !== 'wrong') player.correctGuesses += 1;

    io.to(roomCode).emit('guess:result', result);

    if (result.result === 'correct') {
      io.to(roomCode).emit('card:solved', {
        cardId, points: result.points, teamIndex: player.teamIndex, difficulty: card.difficulty,
      });
      io.to(roomCode).emit('score:update', state.teams);
      io.to(roomCode).emit('board:updated', state.board.map(toClientCard));

      const team = state.teams[player.teamIndex];
      io.to(roomCode).emit('streak:update', { count: team.streak, teamIndex: player.teamIndex });
      if (team.streak >= 3) {
        io.to(roomCode).emit('combo:trigger', { level: Math.min(team.streak - 2, 5), teamIndex: player.teamIndex });
      }

      activeCards.delete(roomCode);

      // Check bonus
      if (checkBonusTrigger(state, player.teamIndex)) {
        const usedIds = state.board.map(c => c.wordEntry.id);
        const bonusCards = generateBonusCards(state, state.settings.bonusBatchSize, usedIds);
        state.board.push(...bonusCards);
        state.currentRound!.bonusCardsGenerated += bonusCards.length;
        io.to(roomCode).emit('bonus:generated', bonusCards.map(toClientCard));
        io.to(roomCode).emit('board:updated', state.board.map(toClientCard));
      }

      // Check if all cards solved
      if (state.board.every(c => c.solved)) {
        handleRoundEnd(roomCode);
      }
    }
  });

  // ── ROUND READY (After summary) ──
  socket.on('round:ready', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'round_end') return;
    if (isGameOver(state)) {
      handleRoundEnd(roomCode);
      return;
    }
    // Reset board for new round
    state.board = generateBoard(state, state.board.map(c => c.wordEntry.id));
    activeCards.delete(roomCode);
    const round = startRound(state);
    io.to(roomCode).emit('round:start', round, state.board.map(toClientCard));
    broadcastState(roomCode);
    startTimer(roomCode);
  });

  // ── DESCRIBER SKIP (host only, before round starts) ──
  socket.on('describer:skip', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'round_end') return;
    const host = state.teams.flatMap(t => t.players).find(p => p.id === socket.id && p.isHost);
    if (!host) return;

    // Rotate the queue for the team that's about to play
    const nextTeamIndex = state.roundNumber % state.settings.teamCount;
    const team = state.teams[nextTeamIndex];
    if (team.describerQueue.length > 1) {
      const skipped = team.describerQueue.shift();
      if (skipped) team.describerQueue.push(skipped);
    }
    
    // Recalculate round to show updated describer
    const teamIndex = state.roundNumber % state.settings.teamCount;
    const targetTeam = state.teams[teamIndex];
    const describerId = targetTeam.describerQueue.length > 0
      ? targetTeam.describerQueue[state.roundNumber % targetTeam.describerQueue.length]
      : targetTeam.players[0]?.id || '';
      
    if (state.currentRound) {
      state.currentRound.describerId = describerId;
    }
    
    broadcastState(roomCode);
  });

  // ── DESCRIBER PROMOTE (any player in lobby) ──
  socket.on('describer:promote', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'lobby') return;

    for (const team of state.teams) {
      const idx = team.describerQueue.indexOf(socket.id);
      if (idx !== -1) {
        team.describerQueue.splice(idx, 1);
        team.describerQueue.unshift(socket.id);
        break;
      }
    }
    broadcastState(roomCode);
  });

  // ── ADD BOT (Debug) ──
  socket.on('debug:add_bot', (teamIndex: number) => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (!state || state.status !== 'lobby') return;
    
    const targetTeam = state.teams[teamIndex];
    if (!targetTeam || targetTeam.players.length >= state.settings.maxPlayersPerTeam) return;

    const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
    const bot: Player = {
      id: botId,
      name: `Bot ${botId.slice(4, 8)}`,
      teamIndex,
      isHost: false,
      isConnected: true,
      guessCount: 0,
      correctGuesses: 0,
    };
    targetTeam.players.push(bot);
    targetTeam.describerQueue.push(bot.id);
    broadcastState(roomCode);
    console.log(`[Room] Bot ${bot.name} added to ${roomCode}`);
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const roomCode = playerRooms.get(socket.id);
    if (roomCode) {
      const state = getRoom(roomCode);
      if (state) {
        for (const team of state.teams) {
          const player = team.players.find(p => p.id === socket.id);
          if (player) player.isConnected = false;
        }
        io.to(roomCode).emit('room:playerLeft', socket.id);
        broadcastState(roomCode);
        // Clean empty rooms
        const allDisconnected = state.teams.every(t => t.players.every(p => !p.isConnected || p.id.startsWith('bot_')));
        if (allDisconnected) {
          const timer = timers.get(roomCode);
          if (timer) clearInterval(timer);
          timers.delete(roomCode);
          rooms.delete(roomCode);
          activeCards.delete(roomCode);
        }
      }
      playerRooms.delete(socket.id);
    }
    guessTimestamps.delete(socket.id);
    console.log(`[-] Disconnected: ${socket.id}`);
  });

  // ── LEAVE ROOM ──
  socket.on('room:leave', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    const state = getRoom(roomCode);
    if (state) {
      for (const team of state.teams) {
        team.players = team.players.filter(p => p.id !== socket.id);
        team.describerQueue = team.describerQueue.filter(id => id !== socket.id);
      }
      broadcastState(roomCode);
    }
    socket.leave(roomCode);
    playerRooms.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 TabooParty server running on port ${PORT}`);
});
