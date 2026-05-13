'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { TEAM_COLORS } from '@/lib/types';

export function Lobby() {
  const { emit } = useSocket();
  const { gameState, playerId } = useGameStore();
  if (!gameState) return null;

  const isHost = gameState.teams
    .flatMap((t) => t.players)
    .some((p) => p.id === playerId && p.isHost);

  const myTeam = gameState.teams.findIndex((t) =>
    t.players.some((p) => p.id === playerId)
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
            BATTLE LOBBY
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="text-gray-400 text-sm">Room Code:</span>
            <span className="font-mono text-2xl text-neon-cyan text-glow-cyan tracking-[0.4em] font-bold">
              {gameState.roomCode}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Share this code with your teammates
          </p>
        </div>

        {/* Teams */}
        <div className={`grid gap-6 mb-8 ${gameState.settings.teamCount === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {gameState.teams.map((team, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-2xl p-5 border-2 transition-all duration-300 ${
                myTeam === idx
                  ? 'border-opacity-60'
                  : 'border-opacity-20 hover:border-opacity-40'
              }`}
              style={{
                borderColor: TEAM_COLORS[idx]?.color || '#fff',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-display font-bold text-lg"
                  style={{ color: TEAM_COLORS[idx]?.color }}
                >
                  {team.name}
                </h3>
                <span className="text-xs text-gray-500">
                  {team.players.length}/{gameState.settings.maxPlayersPerTeam}
                </span>
              </div>

              <div className="space-y-2 min-h-[80px]">
                {team.players.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      p.id === playerId
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        p.isConnected ? 'bg-neon-green' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium flex-1">
                      {p.name}
                      {p.isHost && (
                        <span className="ml-2 text-xs text-neon-yellow">
                          ★ HOST
                        </span>
                      )}
                      {team.describerQueue[0] === p.id && (
                        <span className="ml-2 text-xs text-neon-cyan">
                          🎤 NEXT
                        </span>
                      )}
                      {p.id === playerId && (
                        <span className="ml-2 text-xs text-gray-500">
                          (you)
                        </span>
                      )}
                    </span>
                    {p.id === playerId && team.describerQueue[0] !== p.id && (
                      <button
                        onClick={() => emit('describer:promote')}
                        className="text-[10px] text-neon-cyan hover:underline"
                      >
                        Describer Me
                      </button>
                    )}
                  </div>
                ))}
                {team.players.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">
                    No players yet
                  </p>
                )}
              </div>

              {myTeam !== idx && (
                <button
                  onClick={() => emit('team:join', idx)}
                  className="w-full mt-3 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
                >
                  Switch to {team.name}
                </button>
              )}
              
              {isHost && (
                <button
                  onClick={() => emit('debug:add_bot', idx)}
                  className="w-full mt-2 py-2 rounded-lg border border-dashed border-neon-cyan/50 text-xs text-neon-cyan/70 hover:text-neon-cyan hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all"
                >
                  + Add Bot (Test)
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <h3 className="font-display font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">
              Match Settings
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SettingItem
                label="Round Duration"
                value={`${gameState.settings.roundDuration}s`}
                options={[
                  { label: '60s', val: 60 },
                  { label: '90s', val: 90 },
                  { label: '120s', val: 120 },
                ]}
                onChange={(v) => emit('settings:update', { roundDuration: v })}
              />
              <SettingItem
                label="Total Rounds"
                value={`${gameState.settings.totalRounds}`}
                options={[
                  { label: '1', val: 1 },
                  { label: '2', val: 2 },
                  { label: '4', val: 4 },
                  { label: '6', val: 6 },
                  { label: '8', val: 8 },
                ]}
                onChange={(v) => emit('settings:update', { totalRounds: v })}
              />
              <SettingItem
                label="Teams"
                value={`${gameState.settings.teamCount}`}
                options={[
                  { label: '2', val: 2 },
                  { label: '3', val: 3 },
                ]}
                onChange={(v) => emit('settings:update', { teamCount: v })}
              />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-2">
                  Advanced Mode
                </span>
                <button
                  onClick={() =>
                    emit('settings:update', {
                      advancedMode: !gameState.settings.advancedMode,
                    })
                  }
                  className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    gameState.settings.advancedMode
                      ? 'bg-neon-orange/20 border border-neon-orange text-neon-orange'
                      : 'bg-surface-700 border border-surface-600 text-gray-400'
                  }`}
                >
                  {gameState.settings.advancedMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start button (host only) */}
        {isHost && (
          <motion.button
            onClick={() => emit('game:start')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-2xl font-display font-black text-2xl text-white shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:shadow-[0_0_60px_rgba(0,240,255,0.4)] transition-all duration-300 tracking-wider"
          >
            ⚡ START BATTLE
          </motion.button>
        )}

        {!isHost && (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
              <span className="text-sm">Waiting for host to start...</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SettingItem({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; val: number }[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 mb-2">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.val}
            onClick={() => onChange(opt.val)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              value === opt.label
                ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                : 'bg-surface-700 border border-surface-600 text-gray-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
