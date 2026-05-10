'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { TEAM_COLORS } from '@/lib/types';

export function RoundSummaryOverlay() {
  const { emit } = useSocket();
  const { showRoundSummary, gameState, playerId } = useGameStore();
  if (!showRoundSummary || !gameState) return null;

  const team = gameState.teams[showRoundSummary.teamIndex];
  const isHost = gameState.teams
    .flatMap((t) => t.players)
    .some((p) => p.id === playerId && p.isHost);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
        className="glass-card-light rounded-3xl p-8 max-w-md w-full text-center border border-white/10"
      >
        <h2 className="font-display text-2xl font-bold text-gray-300 mb-1">
          ROUND {showRoundSummary.roundNumber} COMPLETE
        </h2>
        <p
          className="font-display text-lg font-bold mb-6"
          style={{ color: TEAM_COLORS[showRoundSummary.teamIndex]?.color }}
        >
          {team?.name}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatBox
            label="Cards Solved"
            value={showRoundSummary.cardsSolved.toString()}
            color="text-neon-cyan"
          />
          <StatBox
            label="Score Earned"
            value={`+${showRoundSummary.scoreEarned}`}
            color="text-neon-green"
          />
          <StatBox
            label="Best Streak"
            value={`${showRoundSummary.bestStreak}x`}
            color="text-neon-yellow"
          />
          <StatBox
            label="Bonus Cards"
            value={showRoundSummary.bonusCards.toString()}
            color="text-neon-orange"
          />
        </div>

        {showRoundSummary.topGuesser && (
          <div className="bg-white/5 rounded-xl p-3 mb-6">
            <p className="text-xs text-gray-400 mb-1">Top Guesser</p>
            <p className="font-bold text-neon-cyan">
              {showRoundSummary.topGuesser.name}{' '}
              <span className="text-gray-400 font-normal">
                ({showRoundSummary.topGuesser.correctGuesses} correct)
              </span>
            </p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="space-y-2 mb-6">
          {gameState.teams.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5"
            >
              <span style={{ color: TEAM_COLORS[i]?.color }}>{t.name}</span>
              <span className="font-display font-bold text-lg">
                {t.score}
              </span>
            </div>
          ))}
        </div>

        {isHost && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => emit('round:ready')}
              className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl font-display font-bold text-lg text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all"
            >
              NEXT ROUND →
            </button>
            <button
              onClick={() => emit('describer:skip')}
              className="text-xs text-gray-500 hover:text-white transition-all uppercase tracking-widest"
            >
              Skip Next Describer
            </button>
          </div>
        )}
        {!isHost && (
          <p className="text-gray-500 text-sm animate-pulse">
            Waiting for host to continue...
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`font-display font-black text-2xl ${color}`}>{value}</p>
    </div>
  );
}
