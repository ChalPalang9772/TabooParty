'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';
import { sounds } from './sounds';
import confetti from 'canvas-confetti';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useGameStore();

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (!s.connected) s.connect();

    s.on('connect', () => {
      store.setConnected(true);
      store.setPlayerId(s.id || '');
    });

    s.on('disconnect', () => {
      store.setConnected(false);
    });

    s.on('room:state', (state) => {
      store.setGameState(state);
      // Check if current player is the describer
      if (state.currentRound) {
        store.setIsDescriber(state.currentRound.describerId === s.id);
      }
    });

    s.on('room:error', (msg) => {
      alert(msg);
    });

    s.on('game:started', (state) => {
      store.setGameState(state);
      store.setRoundSummary(null);
      store.setGameOver(null);
    });

    s.on('round:start', (round, board) => {
      store.setIsDescriber(round.describerId === s.id);
      store.updateBoard(board);
      store.setActiveCard(null);
      store.setActiveWord(null, []);
      store.setRoundSummary(null);
      store.setComboLevel(0);
      store.setStreakCount(0);
      store.setUrgent(false);
      sounds?.play('click');
    });

    s.on('round:end', (summary) => {
      store.setRoundSummary(summary);
      store.setActiveCard(null);
      store.setActiveWord(null, []);
      sounds?.stop('timer_urgent');
      sounds?.play('game_over');
    });

    s.on('card:selected', (cardId) => {
      store.setActiveCard(cardId);
      sounds?.play('click');
    });

    s.on('card:word', ({ word, tabooWords }) => {
      store.setActiveWord(word, tabooWords);
    });

    s.on('guess:result', (result) => {
      store.addGuessResult(result);
      if (result.result !== 'wrong' && result.points > 0) {
        sounds?.play('correct');
        const popupId = Math.random().toString(36).substring(2, 9);
        store.addScorePopup({
          id: popupId,
          x: 50 + Math.random() * 200,
          y: 200 + Math.random() * 100,
          points: result.points,
          type: result.result === 'correct' ? 'correct' : 'close',
          timestamp: Date.now(),
        });
        
        // Auto-remove popup after 2 seconds
        setTimeout(() => store.removeScorePopup(popupId), 2000);
      } else if (result.playerId === s.id) {
        sounds?.play('wrong');
      }
    });

    s.on('card:solved', ({ cardId, points, teamIndex, difficulty }) => {
      store.setActiveCard(null);
      store.setActiveWord(null, []);
      if (difficulty === 'insane') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff2d7c', '#00f0ff', '#ffffff']
        });
      }
    });

    s.on('board:updated', (board) => {
      store.updateBoard(board);
    });

    s.on('score:update', (teams) => {
      store.updateTeams(teams);
    });

    s.on('timer:tick', (remaining) => {
      store.updateTimer(remaining);
      if (remaining <= 5 && remaining > 0) {
        sounds?.play('timer_tick');
      }
    });

    s.on('timer:urgent', () => {
      store.setUrgent(true);
      sounds?.play('timer_urgent');
    });

    s.on('streak:update', ({ count }) => {
      store.setStreakCount(count);
    });

    s.on('combo:trigger', ({ level }) => {
      store.setComboLevel(level);
      sounds?.play('combo');
    });

    s.on('game:over', (data) => {
      store.setGameOver(data);
      sounds?.stop('timer_urgent');
      sounds?.play('game_over');
    });

    s.on('bonus:generated', () => {
      sounds?.play('bonus');
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('room:state');
      s.off('room:error');
      s.off('game:started');
      s.off('round:start');
      s.off('round:end');
      s.off('card:selected');
      s.off('card:word');
      s.off('guess:result');
      s.off('card:solved');
      s.off('board:updated');
      s.off('score:update');
      s.off('timer:tick');
      s.off('timer:urgent');
      s.off('streak:update');
      s.off('combo:trigger');
      s.off('game:over');
      s.off('bonus:generated');
    };
  }, []);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return { socket: socketRef.current, emit };
}
