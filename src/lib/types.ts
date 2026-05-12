// ============================================================
// Core Game Types — TabooParty
// ============================================================

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'insane';

export interface WordEntry {
  id: string;
  word: string;
  difficulty: Difficulty;
  category: string;
  tabooWords: string[];
  tags: string[];
  basePointsMin: number;
  basePointsMax: number;
}

export interface GameCard {
  id: string;
  wordEntry: WordEntry;
  difficulty: Difficulty;
  points: number;            // hidden from players until solved
  escalatedPoints: number;   // current points after escalation
  solved: boolean;
  solvedBy: number | null;   // team index
  solvedAt: number | null;   // timestamp
  isBonus: boolean;
  position: number;          // grid position
  hasCloseGuess?: boolean;
}

// What the client sees (no hidden data)
export interface ClientCard {
  id: string;
  word: string;      // Everyone sees the word now
  points: number;    // Everyone sees the points now
  difficulty: Difficulty;
  solved: boolean;
  solvedBy: number | null;
  isBonus: boolean;
  position: number;
  escalationLevel: number;
}

export interface Player {
  id: string;
  name: string;
  teamIndex: number;
  isHost: boolean;
  isConnected: boolean;
  guessCount: number;
  correctGuesses: number;
}

export interface Team {
  index: number;
  name: string;
  color: string;
  players: Player[];
  score: number;
  roundScore: number;
  solvedCards: number;
  streak: number;
  maxStreak: number;
  describerQueue: string[]; // player IDs in rotation order
}

export interface RoomSettings {
  teamCount: number;
  maxPlayersPerTeam: number;
  roundDuration: number;
  totalRounds: number;
  categories: string[];
  advancedMode: boolean;
  boardSize: number;
  difficultyDistribution: Record<Difficulty, number>;
  escalationRange: [number, number];
  bonusCardThreshold: number;
  bonusBatchSize: number;
}

export interface Round {
  number: number;
  teamIndex: number;
  describerId: string;
  startedAt: number | null;
  endedAt: number | null;
  cardsAttempted: number;
  cardsSolved: number;
  scoreEarned: number;
  bonusCardsGenerated: number;
}

export type GameStatus = 
  | 'lobby'
  | 'starting'
  | 'playing'
  | 'round_end'
  | 'game_over';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  settings: RoomSettings;
  teams: Team[];
  board: GameCard[];
  currentRound: Round | null;
  roundNumber: number;
  totalRounds: number;
  timeRemaining: number;
  escalationCount: number;  // how many escalations have occurred this round
}

// Client-safe version of GameState
export interface ClientGameState {
  roomCode: string;
  status: GameStatus;
  settings: RoomSettings;
  teams: Team[];
  board: ClientCard[];
  currentRound: Round | null;
  roundNumber: number;
  totalRounds: number;
  timeRemaining: number;
  escalationCount: number;
}

export interface GuessResult {
  guess: string;
  playerId: string;
  playerName: string;
  teamIndex: number;
  result: 'correct' | 'close' | 'wrong';
  points: number;
  cardId: string | null;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  points: number;
  type: 'correct' | 'close' | 'bonus';
  timestamp: number;
}

// Socket.io event types
export interface ServerToClientEvents {
  'room:state': (state: ClientGameState) => void;
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:error': (message: string) => void;
  'game:started': (state: ClientGameState) => void;
  'round:start': (round: Round, board: ClientCard[]) => void;
  'round:end': (summary: RoundSummary) => void;
  'card:selected': (cardId: string) => void;
  'card:word': (data: { word: string; tabooWords: string[] }) => void;
  'guess:result': (result: GuessResult) => void;
  'card:solved': (data: { cardId: string; points: number; teamIndex: number }) => void;
  'board:updated': (board: ClientCard[]) => void;
  'bonus:generated': (newCards: ClientCard[]) => void;
  'score:update': (teams: Team[]) => void;
  'timer:tick': (remaining: number) => void;
  'timer:urgent': () => void;
  'streak:update': (data: { count: number; teamIndex: number }) => void;
  'combo:trigger': (data: { level: number; teamIndex: number }) => void;
  'game:over': (data: { teams: Team[]; winner: number; stats: GameStats }) => void;
}

export interface ClientToServerEvents {
  'room:create': (settings: Partial<RoomSettings>, playerName: string) => void;
  'room:join': (code: string, playerName: string) => void;
  'room:leave': () => void;
  'team:join': (teamIndex: number) => void;
  'settings:update': (settings: Partial<RoomSettings>) => void;
  'game:start': () => void;
  'round:ready': () => void;
  'describer:skip': (nextDescriberId: string) => void;
  'card:select': (cardId: string) => void;
  'card:deselect': () => void;
  'guess:submit': (text: string) => void;
  'chat:send': (message: string) => void;
}

export interface RoundSummary {
  roundNumber: number;
  teamIndex: number;
  describerId: string;
  cardsSolved: number;
  scoreEarned: number;
  bonusCards: number;
  bestStreak: number;
  topGuesser: { name: string; correctGuesses: number } | null;
}

export interface GameStats {
  totalRounds: number;
  totalCardsSolved: number;
  totalBonusCards: number;
  longestStreak: { count: number; team: string };
  mvpGuesser: { name: string; score: number };
  mvpDescriber: { name: string; cardsDescribed: number };
  highestSingleCard: { word: string; points: number; team: string };
}

// Difficulty config
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  color: string;
  glowColor: string;
  bgGradient: string;
  stars: number;
  label: string;
  pointRange: [number, number];
  cssClass: string;
}> = {
  easy: {
    color: '#39ff14',
    glowColor: 'rgba(57, 255, 20, 0.3)',
    bgGradient: 'from-green-900/20 to-green-800/10',
    stars: 1,
    label: 'EASY',
    pointRange: [4, 7],
    cssClass: 'card-easy',
  },
  moderate: {
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.3)',
    bgGradient: 'from-cyan-900/20 to-cyan-800/10',
    stars: 2,
    label: 'MODERATE',
    pointRange: [15, 25],
    cssClass: 'card-moderate',
  },
  hard: {
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    bgGradient: 'from-purple-900/20 to-purple-800/10',
    stars: 3,
    label: 'HARD',
    pointRange: [29, 36],
    cssClass: 'card-hard',
  },
  insane: {
    color: '#ff2d7c',
    glowColor: 'rgba(255, 45, 124, 0.3)',
    bgGradient: 'from-pink-900/20 to-pink-800/10',
    stars: 4,
    label: 'INSANE',
    pointRange: [53, 77],
    cssClass: 'card-insane',
  },
};

export const TEAM_COLORS = [
  { name: 'Team Alpha', color: '#00f0ff', gradient: 'from-cyan-500 to-blue-600' },
  { name: 'Team Bravo', color: '#ff2d7c', gradient: 'from-pink-500 to-red-600' },
  { name: 'Team Charlie', color: '#ffd600', gradient: 'from-yellow-400 to-orange-500' },
];

export const DEFAULT_SETTINGS: RoomSettings = {
  teamCount: 2,
  maxPlayersPerTeam: 11,
  roundDuration: 90,
  totalRounds: 8,
  categories: ['general', 'tech', 'entertainment', 'college'],
  advancedMode: false,
  boardSize: 12,
  difficultyDistribution: { easy: 4, moderate: 4, hard: 3, insane: 1 },
  escalationRange: [2, 4],
  bonusCardThreshold: 7,
  bonusBatchSize: 4,
};
