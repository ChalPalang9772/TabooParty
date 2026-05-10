'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { TEAM_COLORS } from '@/lib/types';
import { useEffect, useRef } from 'react';

export function GameOverOverlay() {
  const { showGameOver } = useGameStore();
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (showGameOver && !confettiTriggered.current) {
      confettiTriggered.current = true;
      // Dynamic import to avoid SSR issues
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        // Big burst
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#00f0ff', '#ff2d7c', '#a855f7', '#39ff14', '#ffd600'],
        });
        // Side bursts
        setTimeout(() => {
          confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 } });
          confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 } });
        }, 300);
      });
    }
  }, [showGameOver]);

  if (!showGameOver) return null;

  const { teams, winner, stats } = showGameOver;
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass-card-light rounded-3xl p-8 md:p-10 max-w-lg w-full text-center border border-white/15"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>

        <h1 className="font-display text-3xl md:text-4xl font-black gradient-text mb-2">
          GAME OVER
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-display text-xl font-bold mb-8"
          style={{ color: TEAM_COLORS[winner]?.color }}
        >
          {sorted[0]?.name} WINS!
        </motion.p>

        {/* Final scores */}
        <div className="space-y-3 mb-8">
          {sorted.map((team, i) => (
            <motion.div
              key={team.index}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`flex items-center justify-between px-5 py-3 rounded-xl ${
                i === 0
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-xl text-gray-500">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <span
                  className="font-display font-bold"
                  style={{ color: TEAM_COLORS[team.index]?.color }}
                >
                  {team.name}
                </span>
              </div>
              <span className="font-display font-black text-2xl text-white">
                {team.score}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Cards Solved</p>
            <p className="font-display font-bold text-neon-cyan text-lg">
              {stats.totalCardsSolved}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Longest Streak</p>
            <p className="font-display font-bold text-neon-yellow text-lg">
              {stats.longestStreak.count}x
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Rounds</p>
            <p className="font-display font-bold text-neon-purple text-lg">
              {stats.totalRounds}
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-xl font-display font-bold text-lg text-white hover:shadow-[0_0_40px_rgba(0,240,255,0.3)] transition-all"
        >
          NEW GAME
        </button>
      </motion.div>
    </motion.div>
  );
}
