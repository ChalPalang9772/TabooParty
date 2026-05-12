// ============================================================
// Game Engine — Core server-side game logic
// ============================================================
import {
  GameState, GameCard, ClientCard, ClientGameState, Team,
  Round, RoomSettings, Difficulty, GuessResult, RoundSummary,
  GameStats, DEFAULT_SETTINGS, TEAM_COLORS, DIFFICULTY_CONFIG, WordEntry,
} from './types';
import { generateBoardWords } from './words';
import { matchGuess } from './fuzzy';

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createGameState(roomCode: string, settings: Partial<RoomSettings> = {}): GameState {
  const merged: RoomSettings = { ...DEFAULT_SETTINGS, ...settings };
  const teams: Team[] = [];
  for (let i = 0; i < merged.teamCount; i++) {
    teams.push({
      index: i,
      name: TEAM_COLORS[i].name,
      color: TEAM_COLORS[i].color,
      players: [],
      score: 0,
      roundScore: 0,
      solvedCards: 0,
      streak: 0,
      maxStreak: 0,
      describerQueue: [],
    });
  }
  return {
    roomCode,
    status: 'lobby',
    settings: merged,
    teams,
    board: [],
    currentRound: null,
    roundNumber: 0,
    totalRounds: merged.totalRounds,
    timeRemaining: merged.roundDuration,
    escalationCount: 0,
  };
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, moderate: 1, hard: 2, insane: 3 };

export function generateBoard(state: GameState, usedWordIds: string[] = []): GameCard[] {
  const words = generateBoardWords(
    state.settings.categories,
    state.settings.difficultyDistribution,
    usedWordIds
  );

  // Sort words by difficulty order
  words.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  return words.map((entry, i) => {
    const range = DIFFICULTY_CONFIG[entry.difficulty].pointRange;
    const points = randomInRange(range[0], range[1]);
    return {
      id: generateId(),
      wordEntry: entry,
      difficulty: entry.difficulty,
      points,
      escalatedPoints: points,
      solved: false,
      solvedBy: null,
      solvedAt: null,
      isBonus: false,
      position: i,
    };
  });
}

export function generateBonusCards(
  state: GameState,
  count: number,
  usedWordIds: string[]
): GameCard[] {
  const bonusDist: Record<Difficulty, number> = { easy: 1, moderate: 1, hard: 1, insane: 1 };
  if (count !== 4) {
    bonusDist.easy = Math.max(0, count - 3);
    bonusDist.moderate = Math.min(count, 1);
    bonusDist.hard = Math.min(count, 1);
    bonusDist.insane = Math.min(count, 1);
  }
  const words = generateBoardWords(state.settings.categories, bonusDist, usedWordIds);
  
  // Sort bonus cards too
  words.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  const startPos = state.board.length;
  return words.map((entry, i) => {
    const range = DIFFICULTY_CONFIG[entry.difficulty].pointRange;
    const basePoints = randomInRange(range[0], range[1]);
    const escalated = basePoints + state.escalationCount * randomInRange(
      state.settings.escalationRange[0], state.settings.escalationRange[1]
    );
    return {
      id: generateId(),
      wordEntry: entry,
      difficulty: entry.difficulty,
      points: basePoints,
      escalatedPoints: Math.min(escalated, basePoints * 2), // cap at 2x
      solved: false,
      solvedBy: null,
      solvedAt: null,
      isBonus: true,
      position: startPos + i,
    };
  });
}

export function toClientCard(card: GameCard): ClientCard {
  return {
    id: card.id,
    word: card.wordEntry.word, // Now exported to all
    points: card.escalatedPoints, // Now exported to all
    difficulty: card.difficulty,
    solved: card.solved,
    solvedBy: card.solvedBy,
    isBonus: card.isBonus,
    position: card.position,
    escalationLevel: Math.min(
      Math.floor((card.escalatedPoints - card.points) / 3), 5
    ),
  };
}

export function toClientState(state: GameState): ClientGameState {
  return {
    ...state,
    board: state.board.map(toClientCard),
  };
}

export function startRound(state: GameState): Round {
  let teamIndex = state.roundNumber % state.settings.teamCount;
  let team = state.teams[teamIndex];

  let attempts = 0;
  while (team.players.filter(p => p.isConnected).length === 0 && attempts < state.settings.teamCount) {
    state.roundNumber++;
    teamIndex = state.roundNumber % state.settings.teamCount;
    team = state.teams[teamIndex];
    attempts++;
  }

  // FIXED ROTATION: Handle empty teams and cycling correctly
  let describerId = '';
  const connectedPlayers = team.players.filter(p => p.isConnected);

  if (connectedPlayers.length > 0) {
    if (team.describerQueue.length > 0) {
      // Find the first player in the queue who is still in the team AND connected
      const validInQueue = team.describerQueue.find(id => connectedPlayers.some(p => p.id === id));
      if (validInQueue) {
        describerId = validInQueue;
        // Move them to the end of the queue for next time
        team.describerQueue = [...team.describerQueue.filter(id => id !== validInQueue), validInQueue];
      }
    }
    
    // Fallback if no queue or no valid player in queue
    if (!describerId) {
      describerId = connectedPlayers[state.roundNumber % connectedPlayers.length].id;
    }
  }

  team.roundScore = 0;
  team.solvedCards = 0;
  team.streak = 0;

  const round: Round = {
    number: state.roundNumber + 1,
    teamIndex,
    describerId,
    startedAt: Date.now(),
    endedAt: null,
    cardsAttempted: 0,
    cardsSolved: 0,
    scoreEarned: 0,
    bonusCardsGenerated: 0,
  };
  state.currentRound = round;
  state.roundNumber = round.number;
  state.status = 'playing';
  state.timeRemaining = state.settings.roundDuration;
  state.escalationCount = 0;
  return round;
}

export function processGuess(
  state: GameState,
  activeCardId: string,
  guess: string,
  playerId: string,
  playerName: string,
  teamIndex: number
): GuessResult | null {
  if (state.status !== 'playing' || !state.currentRound) return null;
  if (state.currentRound.teamIndex !== teamIndex) return null;
  if (state.currentRound.describerId === playerId) return null; // describer can't guess

  const card = state.board.find(c => c.id === activeCardId);
  if (!card || card.solved) return null;

  const { result, pointMultiplier } = matchGuess(guess, card.wordEntry.word);
  const points = Math.ceil(card.escalatedPoints * pointMultiplier);
  const team = state.teams[teamIndex];

  if (result === 'correct') {
    card.solved = true;
    card.solvedBy = teamIndex;
    card.solvedAt = Date.now();
    team.score += points;
    team.roundScore += points;
    team.solvedCards += 1;
    team.streak += 1;
    if (team.streak > team.maxStreak) team.maxStreak = team.streak;
    state.currentRound.cardsSolved += 1;
    state.currentRound.scoreEarned += points;

    // Advanced mode escalation
    if (state.settings.advancedMode) {
      state.escalationCount += 1;
      for (const c of state.board) {
        if (!c.solved) {
          const inc = randomInRange(
            state.settings.escalationRange[0],
            state.settings.escalationRange[1]
          );
          c.escalatedPoints = Math.min(c.escalatedPoints + inc, c.points * 2);
        }
      }
    }
  } else if (result === 'close') {
    card.hasCloseGuess = true;
    team.streak = 0; // Misspell breaks streak
  } else {
    team.streak = 0;
  }

  return {
    guess,
    playerId,
    playerName,
    teamIndex,
    result,
    points: result === 'correct' ? points : 0, // Points are only for correct here
    cardId: activeCardId,
  };
}

export function checkBonusTrigger(state: GameState, teamIndex: number): boolean {
  const team = state.teams[teamIndex];
  const threshold = state.settings.bonusCardThreshold;
  const round = state.currentRound;
  if (!round) return false;

  // First bonus: solved >= threshold
  if (round.bonusCardsGenerated === 0 && team.solvedCards >= threshold) return true;
  // Subsequent bonus: solved half+1 of latest batch
  if (round.bonusCardsGenerated > 0) {
    const batchSize = state.settings.bonusBatchSize;
    const bonusCards = state.board.filter(c => c.isBonus && c.solvedBy === teamIndex);
    const latestBatchStart = state.board.length - batchSize;
    const latestBonusSolved = state.board
      .slice(Math.max(0, latestBatchStart))
      .filter(c => c.isBonus && c.solved && c.solvedBy === teamIndex).length;
    if (latestBonusSolved >= Math.ceil(batchSize / 2) + 1) return true;
  }
  return false;
}

export function endRound(state: GameState): RoundSummary | null {
  if (!state.currentRound) return null;
  state.currentRound.endedAt = Date.now();
  state.status = 'round_end';

  const round = state.currentRound;
  const team = state.teams[round.teamIndex];

  // Award half points for close guesses that weren't fully solved
  state.board.forEach(c => {
    if (!c.solved && c.hasCloseGuess) {
       c.solved = true; 
       c.solvedBy = team.index;
       const pts = Math.ceil(c.escalatedPoints * 0.5);
       team.score += pts;
       team.roundScore += pts;
       team.solvedCards += 1;
       round.cardsSolved += 1;
       round.scoreEarned += pts;
    }
  });

  // Find top guesser
  const guessers = team.players.filter(p => p.id !== round.describerId);
  const topGuesser = guessers.length > 0
    ? guessers.reduce((best, p) => p.correctGuesses > best.correctGuesses ? p : best)
    : null;

  return {
    roundNumber: round.number,
    teamIndex: round.teamIndex,
    describerId: round.describerId,
    cardsSolved: round.cardsSolved,
    scoreEarned: round.scoreEarned,
    bonusCards: round.bonusCardsGenerated,
    bestStreak: team.maxStreak,
    topGuesser: topGuesser ? { name: topGuesser.name, correctGuesses: topGuesser.correctGuesses } : null,
  };
}

export function isGameOver(state: GameState): boolean {
  return state.roundNumber >= state.totalRounds;
}

export function getGameStats(state: GameState): GameStats {
  const allTeams = state.teams;
  const longestStreak = allTeams.reduce((best, t) =>
    t.maxStreak > best.count ? { count: t.maxStreak, team: t.name } : best,
    { count: 0, team: '' }
  );

  return {
    totalRounds: state.roundNumber,
    totalCardsSolved: state.board.filter(c => c.solved).length,
    totalBonusCards: state.board.filter(c => c.isBonus).length,
    longestStreak,
    mvpGuesser: { name: 'TBD', score: 0 },
    mvpDescriber: { name: 'TBD', cardsDescribed: 0 },
    highestSingleCard: { word: '', points: 0, team: '' },
  };
}
