'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/store';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';
import { RoundSummaryOverlay } from '@/components/RoundSummary';
import { GameOverOverlay } from '@/components/GameOver';

export default function Home() {
  const { emit } = useSocket();
  const {
    connected, gameState, playerName, roomCode,
    showRoundSummary, showGameOver,
    setPlayerName,
  } = useGameStore();

  const [screen, setScreen] = useState<'home' | 'create' | 'join'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleCreate = () => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    emit('room:create', {}, nameInput.trim());
  };

  const handleJoin = () => {
    if (!nameInput.trim() || !joinCode.trim()) return;
    setPlayerName(nameInput.trim());
    emit('room:join', joinCode.trim().toUpperCase(), nameInput.trim());
  };

  // If we have a game state, show the appropriate screen
  if (gameState) {
    if (gameState.status === 'lobby') {
      return <Lobby />;
    }
    return (
      <>
        <GameBoard />
        <AnimatePresence>
          {showRoundSummary && <RoundSummaryOverlay />}
          {showGameOver && <GameOverOverlay />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.h1
            className="font-display text-6xl md:text-7xl font-black tracking-tight gradient-text mb-3"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            TABOO
            <span className="block text-4xl md:text-5xl text-neon-cyan text-glow-cyan">
              PARTY
            </span>
          </motion.h1>
          <motion.p
            className="text-gray-400 text-sm tracking-[0.3em] uppercase mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Competitive Word Warfare
          </motion.p>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent mt-6 mx-auto w-48"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          />
        </div>

        {/* Connection indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Name input */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                  Your Callsign
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full px-5 py-4 bg-surface-800 border border-surface-600 rounded-xl text-white placeholder-gray-600 focus:border-neon-cyan transition-all text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => nameInput.trim() && setScreen('create')}
                  disabled={!connected || !nameInput.trim()}
                  className="btn-neon relative px-6 py-4 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/40 rounded-xl font-display font-bold text-lg text-neon-cyan hover:border-neon-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  CREATE
                  <span className="block text-xs font-normal text-gray-400 mt-1">New Room</span>
                </button>
                <button
                  onClick={() => nameInput.trim() && setScreen('join')}
                  disabled={!connected || !nameInput.trim()}
                  className="btn-neon relative px-6 py-4 bg-gradient-to-br from-neon-pink/20 to-neon-orange/20 border border-neon-pink/40 rounded-xl font-display font-bold text-lg text-neon-pink hover:border-neon-pink hover:shadow-[0_0_30px_rgba(255,45,124,0.2)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  JOIN
                  <span className="block text-xs font-normal text-gray-400 mt-1">Enter Code</span>
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-4">Creating room as</p>
                <p className="text-2xl font-display font-bold text-neon-cyan text-glow-cyan">
                  {nameInput}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen('home')}
                  className="px-6 py-3 border border-surface-600 rounded-xl text-gray-400 hover:text-white hover:border-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!connected}
                  className="btn-neon px-6 py-3 bg-neon-cyan/20 border border-neon-cyan rounded-xl font-bold text-neon-cyan hover:bg-neon-cyan/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all disabled:opacity-30"
                >
                  Launch Room
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  className="w-full px-5 py-4 bg-surface-800 border border-surface-600 rounded-xl text-white text-center font-mono text-2xl tracking-[0.5em] placeholder-gray-600 focus:border-neon-pink transition-all uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen('home')}
                  className="px-6 py-3 border border-surface-600 rounded-xl text-gray-400 hover:text-white hover:border-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!connected || joinCode.length < 4}
                  className="btn-neon px-6 py-3 bg-neon-pink/20 border border-neon-pink rounded-xl font-bold text-neon-pink hover:bg-neon-pink/30 hover:shadow-[0_0_30px_rgba(255,45,124,0.3)] transition-all disabled:opacity-30"
                >
                  Join Battle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features / Rules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/5"
        >
          <div className="glass-card p-4 rounded-xl">
            <h4 className="text-neon-cyan font-bold text-xs uppercase tracking-widest mb-1">FREE CHOICE</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">Pick any card on the board. No forced order. Play strategically.</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <h4 className="text-neon-pink font-bold text-xs uppercase tracking-widest mb-1">ADVANCED MODE</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">Cards escalate in value as you solve. High risk, insane rewards.</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <h4 className="text-neon-yellow font-bold text-xs uppercase tracking-widest mb-1">INFINITE COMBOS</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">Hit streaks to trigger bonus cards and chain massive scores.</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <h4 className="text-neon-green font-bold text-xs uppercase tracking-widest mb-1">FUZZY MATCHING</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">Fast-paced guessing with typo tolerance. Intensity over accuracy.</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-8 text-gray-700 text-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="tracking-[0.5em] uppercase">Built for Intense Competition</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
