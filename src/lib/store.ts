import { create } from 'zustand';
import {
  ClientGameState, ClientCard, Player, Team, GuessResult,
  RoundSummary, GameStats, RoomSettings, ScorePopup,
} from './types';

interface GameStore {
  // Connection
  connected: boolean;
  playerName: string;
  playerId: string;
  roomCode: string | null;

  // Game state
  gameState: ClientGameState | null;
  activeCardId: string | null;
  activeWord: string | null;
  tabooWords: string[];
  isDescriber: boolean;

  // UI state
  guessHistory: GuessResult[];
  scorePopups: ScorePopup[];
  comboLevel: number;
  streakCount: number;
  isUrgent: boolean;
  showRoundSummary: RoundSummary | null;
  showGameOver: { teams: Team[]; winner: number; stats: GameStats } | null;

  // Actions
  setConnected: (v: boolean) => void;
  setPlayerName: (name: string) => void;
  setPlayerId: (id: string) => void;
  setRoomCode: (code: string | null) => void;
  setGameState: (state: ClientGameState) => void;
  setActiveCard: (id: string | null) => void;
  setActiveWord: (word: string | null, taboo: string[]) => void;
  setIsDescriber: (v: boolean) => void;
  addGuessResult: (r: GuessResult) => void;
  addScorePopup: (p: ScorePopup) => void;
  removeScorePopup: (id: string) => void;
  setComboLevel: (level: number) => void;
  setStreakCount: (count: number) => void;
  setUrgent: (v: boolean) => void;
  setRoundSummary: (s: RoundSummary | null) => void;
  setGameOver: (data: { teams: Team[]; winner: number; stats: GameStats } | null) => void;
  updateBoard: (board: ClientCard[]) => void;
  updateTeams: (teams: Team[]) => void;
  updateTimer: (remaining: number) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  playerName: '',
  playerId: '',
  roomCode: null as string | null,
  gameState: null as ClientGameState | null,
  activeCardId: null as string | null,
  activeWord: null as string | null,
  tabooWords: [] as string[],
  isDescriber: false,
  guessHistory: [] as GuessResult[],
  scorePopups: [] as ScorePopup[],
  comboLevel: 0,
  streakCount: 0,
  isUrgent: false,
  showRoundSummary: null as RoundSummary | null,
  showGameOver: null as { teams: Team[]; winner: number; stats: GameStats } | null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setConnected: (v) => set({ connected: v }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),
  setRoomCode: (code) => set({ roomCode: code }),
  setGameState: (state) => set({ gameState: state }),
  setActiveCard: (id) => set({ activeCardId: id }),
  setActiveWord: (word, taboo) => set({ activeWord: word, tabooWords: taboo }),
  setIsDescriber: (v) => set({ isDescriber: v }),
  addGuessResult: (r) => set((s) => ({
    guessHistory: [r, ...s.guessHistory].slice(0, 30),
  })),
  addScorePopup: (p) => set((s) => ({
    scorePopups: [...s.scorePopups, p],
  })),
  removeScorePopup: (id) => set((s) => ({
    scorePopups: s.scorePopups.filter(p => p.id !== id),
  })),
  setComboLevel: (level) => set({ comboLevel: level }),
  setStreakCount: (count) => set({ streakCount: count }),
  setUrgent: (v) => set({ isUrgent: v }),
  setRoundSummary: (s) => set({ showRoundSummary: s }),
  setGameOver: (data) => set({ showGameOver: data }),
  updateBoard: (board) => set((s) => ({
    gameState: s.gameState ? { ...s.gameState, board } : null,
  })),
  updateTeams: (teams) => set((s) => ({
    gameState: s.gameState ? { ...s.gameState, teams } : null,
  })),
  updateTimer: (remaining) => set((s) => ({
    gameState: s.gameState ? { ...s.gameState, timeRemaining: remaining } : null,
    isUrgent: remaining <= 15,
  })),
  reset: () => set(initialState),
}));
