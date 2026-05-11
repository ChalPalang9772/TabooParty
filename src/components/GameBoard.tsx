'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { GameCard } from '@/components/GameCard';
import { TEAM_COLORS, DIFFICULTY_CONFIG } from '@/lib/types';
import confetti from 'canvas-confetti';

export function GameBoard() {
  const { emit } = useSocket();
  const {
    gameState, playerId, isDescriber, activeCardId,
    activeWord, tabooWords, guessHistory, scorePopups,
    comboLevel, streakCount, isUrgent,
  } = useGameStore();

  const [guessInput, setGuessInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus guess input
  useEffect(() => {
    if (!isDescriber && gameState?.status === 'playing') {
      inputRef.current?.focus();
    }
  }, [isDescriber, gameState?.status, activeCardId]);

  const handleSubmitGuess = useCallback(() => {
    const text = guessInput.trim();
    if (!text) return;
    emit('guess:submit', text);
    setGuessInput('');
    inputRef.current?.focus();
  }, [guessInput, emit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitGuess();
    }
  };

  if (!gameState) return null;

  const currentRound = gameState.currentRound;
  const isMyTeamActive = currentRound
    ? gameState.teams[currentRound.teamIndex]?.players.some(
        (p) => p.id === playerId
      )
    : false;

  const timer = gameState.timeRemaining;
  const timerColor = timer <= 10
    ? 'text-neon-red'
    : timer <= 15
    ? 'text-neon-orange'
    : 'text-neon-cyan';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER BAR ═══ */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Team scores */}
          <div className="flex items-center gap-4">
            {gameState.teams.map((team, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  currentRound?.teamIndex === idx
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-white/5'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TEAM_COLORS[idx]?.color }}
                />
                <span
                  className="font-display font-bold text-lg"
                  style={{ color: TEAM_COLORS[idx]?.color }}
                >
                  {team.score}
                </span>
                <span className="text-xs text-gray-500 hidden md:inline">
                  {team.name}
                </span>
              </div>
            ))}
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center">
            <span
              className={`font-mono text-4xl font-black ${timerColor} ${
                isUrgent ? 'timer-urgent' : ''
              }`}
            >
              {timer}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Round {gameState.roundNumber}/{gameState.totalRounds}
            </span>
          </div>

          {/* Round info */}
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {isDescriber ? 'YOU ARE DESCRIBING' : isMyTeamActive ? 'YOUR TEAM — GUESS!' : 'SPECTATING'}
            </p>
            {streakCount >= 2 && (
              <motion.p
                key={streakCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-neon-yellow font-bold text-sm"
              >
                🔥 {streakCount}x STREAK
              </motion.p>
            )}
            {comboLevel > 0 && (
              <motion.p
                key={`combo-${comboLevel}`}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="text-neon-orange font-bold text-xs"
              >
                ⚡ COMBO x{comboLevel}
              </motion.p>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4 md:py-6">
        {/* Describer view: active word + taboo words */}
        {isDescriber && activeWord && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-light rounded-2xl p-5 mb-4 text-center border border-neon-cyan/30"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Describe This Word
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-neon-cyan text-glow-cyan mb-3">
              {activeWord}
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-neon-red uppercase font-bold mr-2 self-center">
                TABOO:
              </span>
              {tabooWords.map((tw, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-red-900/30 border border-neon-red/30 rounded-full text-sm text-neon-red"
                >
                  {tw}
                </span>
              ))}
              <button
                onClick={() => emit('card:deselect')}
                className="ml-4 px-4 py-1 bg-surface-600 border border-white/20 rounded-full text-xs font-bold hover:bg-surface-500 transition-all text-white/70 hover:text-white"
              >
                SKIP CARD
              </button>
            </div>
          </motion.div>
        )}

        {/* Describer: select a card prompt */}
        {isDescriber && !activeWord && gameState.status === 'playing' && (
          <div className="text-center py-3 mb-2">
            <p className="text-gray-400 animate-pulse">
              👆 Select a card from the board to describe
            </p>
          </div>
        )}

        {/* ═══ CARD GRID ═══ */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {gameState.board.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                isDescriber={isDescriber}
                isActive={card.id === activeCardId}
                isMyTeam={isMyTeamActive}
                onSelect={() => {
                  if (isDescriber && !card.solved) {
                    emit('card:select', card.id);
                  }
                }}
              />
            ))}
          </div>

          {/* Score popups */}
          <AnimatePresence>
            {scorePopups.map((popup) => (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1.2, y: -40 }}
                exit={{ opacity: 0, y: -80 }}
                transition={{ duration: 0.8 }}
                className="absolute pointer-events-none z-50"
                style={{ left: popup.x, top: popup.y }}
              >
                <span
                  className={`font-display font-black text-3xl ${
                    popup.type === 'correct'
                      ? 'text-neon-green text-glow-green'
                      : 'text-neon-yellow text-glow-orange'
                  }`}
                >
                  +{popup.points}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ═══ GUESS INPUT ═══ */}
        {isMyTeamActive && !isDescriber && gameState.status === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-0 pt-4 pb-2"
          >
            <div className="glass-card rounded-2xl p-3 border border-white/10">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeCardId
                      ? 'Type your guess and hit Enter...'
                      : 'Waiting for describer to pick a card...'
                  }
                  disabled={!activeCardId}
                  maxLength={50}
                  className="flex-1 px-4 py-3 bg-surface-800 border border-surface-600 rounded-xl text-white placeholder-gray-600 disabled:opacity-30 transition-all text-lg"
                  autoComplete="off"
                />
                <button
                  onClick={handleSubmitGuess}
                  disabled={!activeCardId || !guessInput.trim()}
                  className="px-6 py-3 bg-neon-cyan/20 border border-neon-cyan rounded-xl font-bold text-neon-cyan hover:bg-neon-cyan/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  SEND
                </button>
              </div>

              {/* Recent guesses */}
              <div className="flex flex-wrap gap-2 mt-2 max-h-16 overflow-y-auto">
                {guessHistory.slice(0, 8).map((g, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      g.result === 'correct'
                        ? 'bg-green-900/40 text-neon-green'
                        : g.result === 'close'
                        ? 'bg-yellow-900/40 text-neon-yellow'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {g.guess}{' '}
                    {g.result === 'correct'
                      ? '✓'
                      : g.result === 'close'
                      ? '⚠️ MISSPELLED'
                      : '✗'}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Spectator view */}
        {!isMyTeamActive && gameState.status === 'playing' && (
          <div className="sticky bottom-0 pt-4 pb-2">
            <div className="glass-card rounded-2xl p-4 text-center border border-white/5">
              <p className="text-gray-500 text-sm">
                👁 Spectating — {gameState.teams[currentRound?.teamIndex || 0]?.name}&apos;s turn
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
