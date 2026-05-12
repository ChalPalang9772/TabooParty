'use client';

import { motion } from 'framer-motion';
import { ClientCard, DIFFICULTY_CONFIG, TEAM_COLORS } from '@/lib/types';

interface GameCardProps {
  card: ClientCard;
  isDescriber: boolean;
  isActive: boolean;
  isMyTeam: boolean;
  onSelect: () => void;
}

export function GameCard({
  card,
  isDescriber,
  isActive,
  isMyTeam,
  onSelect,
}: GameCardProps) {
  const config = DIFFICULTY_CONFIG[card.difficulty];
  const stars = '★'.repeat(config.stars) + '☆'.repeat(4 - config.stars);

  const escalationBars = Math.min(card.escalationLevel, 5);

  if (card.solved) {
    return (
      <motion.div
        layout
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 360, opacity: 0.35 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-xl border border-white/10 bg-surface-800/50 p-3 md:p-4 min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center"
      >
        <div
          className="absolute top-2 right-2 w-3 h-3 rounded-full"
          style={{
            backgroundColor:
              card.solvedBy !== null
                ? TEAM_COLORS[card.solvedBy]?.color
                : '#666',
          }}
        />
        <p className="text-gray-500 text-xs line-through mb-1">SOLVED</p>
        <p
          className="font-display font-black text-xl"
          style={{ color: config.color }}
        >
          +{card.points}
        </p>
        {card.isBonus && (
          <span className="text-[10px] text-neon-yellow mt-1">BONUS</span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.button
      layout
      whileHover={isDescriber ? { scale: 1.04, y: -2 } : {}}
      whileTap={isDescriber ? { scale: 0.97 } : {}}
      onClick={onSelect}
      disabled={!isDescriber}
      className={`relative rounded-xl border-2 p-3 md:p-4 min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center transition-all duration-200 bg-gradient-to-br ${config.bgGradient} ${config.cssClass} ${
        isActive
          ? 'ring-2 ring-white/40 scale-[1.03] shadow-lg'
          : ''
      } ${
        isDescriber
          ? 'cursor-pointer hover:bg-white/5'
          : 'cursor-default'
      }`}
    >
      {/* WORD & POINTS (Simplified) */}
      <div className="flex flex-col items-center justify-center flex-1">
        <h3 className="font-display text-sm md:text-lg font-black text-white text-center leading-tight uppercase mb-1">
          {isDescriber ? card.word : config.label}
        </h3>
        <p className="text-xl md:text-2xl font-black" style={{ color: config.color }}>
          {card.points}
        </p>
      </div>

      {/* Minimal Escalation indicator */}
      {escalationBars > 0 && (
        <div className="flex gap-0.5 mt-1 opacity-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-2 rounded-full ${
                i < escalationBars ? 'bg-white' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bonus badge */}
      {card.isBonus && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-neon-yellow text-surface-900 text-[9px] font-black rounded-md"
        >
          BONUS
        </motion.span>
      )}

      {/* Active glow indicator */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{
            boxShadow: [
              '0 0 10px rgba(255,255,255,0.1)',
              '0 0 25px rgba(255,255,255,0.2)',
              '0 0 10px rgba(255,255,255,0.1)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}
