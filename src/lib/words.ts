// ============================================================
// Word Database — Curated entries with difficulty based on
// describability, ambiguity, and communication friction
// ============================================================

import { WordEntry, Difficulty } from './types';

function w(
  word: string,
  difficulty: Difficulty,
  category: string,
  tabooWords: string[],
  tags: string[] = []
): WordEntry {
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [4, 7], moderate: [15, 25], hard: [29, 36], insane: [53, 77],
  };
  const [min, max] = ranges[difficulty];
  return {
    id: `${category}-${word.toLowerCase().replace(/\s+/g, '-')}`,
    word, difficulty, category, tabooWords, tags,
    basePointsMin: min, basePointsMax: max,
  };
}

export const WORD_DATABASE: WordEntry[] = [
  // ── GENERAL ──
  w('Umbrella', 'easy', 'general', ['rain', 'wet', 'cover'], ['object']),
  w('Birthday', 'easy', 'general', ['cake', 'party', 'age'], ['event']),
  w('Sunglasses', 'easy', 'general', ['sun', 'eyes', 'shade'], ['accessory']),
  w('Homework', 'easy', 'general', ['school', 'study', 'assignment'], ['education']),
  w('Traffic Jam', 'easy', 'general', ['car', 'road', 'stuck'], ['commute']),
  w('Password', 'easy', 'general', ['login', 'secret', 'type'], ['security']),
  w('Elevator', 'easy', 'general', ['up', 'down', 'floor'], ['building']),
  w('Breakfast', 'easy', 'general', ['morning', 'eat', 'meal'], ['food']),
  w('Passport', 'moderate', 'general', ['travel', 'country', 'identity'], ['document']),
  w('Déjà vu', 'moderate', 'general', ['again', 'memory', 'feeling'], ['experience']),
  w('Procrastination', 'moderate', 'general', ['delay', 'lazy', 'later'], ['habit']),
  w('Nostalgia', 'moderate', 'general', ['past', 'memory', 'miss'], ['emotion']),
  w('Sarcasm', 'moderate', 'general', ['joke', 'irony', 'tone'], ['communication']),
  w('Claustrophobia', 'hard', 'general', ['fear', 'small', 'space'], ['phobia']),
  w('Serendipity', 'hard', 'general', ['luck', 'accident', 'find'], ['concept']),
  w('Cognitive Dissonance', 'hard', 'general', ['conflict', 'belief', 'mind'], ['psychology']),
  w('Existential Crisis', 'insane', 'general', ['life', 'meaning', 'purpose', 'exist'], ['philosophy']),
  w('Paradox', 'hard', 'general', ['contradiction', 'logic', 'impossible'], ['concept']),
  w('Bureaucracy', 'moderate', 'general', ['government', 'paper', 'rules'], ['system']),
  w('Jet Lag', 'easy', 'general', ['travel', 'sleep', 'time'], ['health']),

  // ── TECH ──
  w('WiFi', 'easy', 'tech', ['internet', 'connect', 'wireless'], ['network']),
  w('Screenshot', 'easy', 'tech', ['capture', 'screen', 'image'], ['feature']),
  w('Bluetooth', 'easy', 'tech', ['wireless', 'connect', 'phone'], ['protocol']),
  w('Algorithm', 'moderate', 'tech', ['code', 'step', 'compute'], ['cs']),
  w('Cryptocurrency', 'moderate', 'tech', ['bitcoin', 'digital', 'money'], ['finance']),
  w('Artificial Intelligence', 'moderate', 'tech', ['AI', 'machine', 'learn', 'robot'], ['ml']),
  w('Blockchain', 'moderate', 'tech', ['chain', 'ledger', 'crypto'], ['distributed']),
  w('API', 'hard', 'tech', ['interface', 'connect', 'program', 'application'], ['dev']),
  w('Recursion', 'hard', 'tech', ['repeat', 'itself', 'function', 'loop'], ['cs']),
  w('Machine Learning', 'hard', 'tech', ['AI', 'data', 'train', 'model', 'learn'], ['ml']),
  w('Quantum Computing', 'insane', 'tech', ['quantum', 'qubit', 'superposition', 'computer'], ['physics']),
  w('Docker Container', 'hard', 'tech', ['virtual', 'deploy', 'package', 'container'], ['devops']),
  w('Tech Debt', 'moderate', 'tech', ['code', 'fix', 'later', 'shortcut'], ['dev']),
  w('Stack Overflow', 'easy', 'tech', ['error', 'help', 'answer', 'website'], ['dev']),
  w('Cloud Computing', 'moderate', 'tech', ['server', 'remote', 'AWS', 'cloud'], ['infra']),
  w('Open Source', 'moderate', 'tech', ['free', 'code', 'community', 'source'], ['dev']),
  w('Dark Mode', 'easy', 'tech', ['black', 'theme', 'night', 'dark'], ['ui']),
  w('Firewall', 'moderate', 'tech', ['security', 'block', 'protect', 'wall'], ['security']),
  w('Debugging', 'moderate', 'tech', ['fix', 'error', 'bug', 'code'], ['dev']),
  w('Neural Network', 'insane', 'tech', ['brain', 'layers', 'deep', 'network', 'neural'], ['ml']),

  // ── ENTERTAINMENT ──
  w('Plot Twist', 'easy', 'entertainment', ['story', 'surprise', 'unexpected'], ['narrative']),
  w('Cliffhanger', 'easy', 'entertainment', ['end', 'suspense', 'wait'], ['narrative']),
  w('Binge Watch', 'easy', 'entertainment', ['series', 'many', 'watch'], ['streaming']),
  w('Sequel', 'easy', 'entertainment', ['next', 'part', 'continue'], ['film']),
  w('Oscar', 'moderate', 'entertainment', ['award', 'movie', 'best', 'academy'], ['film']),
  w('Method Acting', 'hard', 'entertainment', ['character', 'become', 'role', 'act'], ['acting']),
  w('Box Office', 'moderate', 'entertainment', ['money', 'ticket', 'movie', 'revenue'], ['film']),
  w('Autotune', 'moderate', 'entertainment', ['voice', 'pitch', 'correct', 'music'], ['music']),
  w('Anime Filler', 'moderate', 'entertainment', ['episode', 'skip', 'story', 'extra'], ['anime']),
  w('Isekai', 'hard', 'entertainment', ['world', 'another', 'transport', 'fantasy'], ['anime']),
  w('K-Drama', 'moderate', 'entertainment', ['Korean', 'drama', 'series', 'show'], ['tv']),
  w('Bollywood', 'easy', 'entertainment', ['Hindi', 'movie', 'Indian', 'dance'], ['film']),
  w('Stand-up Comedy', 'easy', 'entertainment', ['joke', 'stage', 'funny', 'laugh'], ['comedy']),
  w('Spoiler', 'easy', 'entertainment', ['reveal', 'ending', 'tell'], ['social']),
  w('Background Score', 'hard', 'entertainment', ['music', 'movie', 'scene', 'sound'], ['film']),

  // ── COLLEGE LIFE ──
  w('Attendance', 'easy', 'college', ['class', 'present', 'roll'], ['academic']),
  w('CGPA', 'easy', 'college', ['grade', 'score', 'cumulative', 'point'], ['academic']),
  w('Internship', 'easy', 'college', ['work', 'company', 'summer', 'experience'], ['career']),
  w('Placement Season', 'easy', 'college', ['job', 'company', 'campus', 'hire'], ['career']),
  w('All-nighter', 'easy', 'college', ['night', 'sleep', 'study', 'exam'], ['culture']),
  w('Proxy', 'moderate', 'college', ['attendance', 'friend', 'fake', 'mark'], ['culture']),
  w('Bell Curve', 'moderate', 'college', ['grade', 'distribution', 'curve'], ['academic']),
  w('Peer Review', 'moderate', 'college', ['check', 'classmate', 'evaluate'], ['academic']),
  w('Case Study', 'moderate', 'college', ['business', 'analyze', 'example', 'situation'], ['mba']),
  w('Group Project', 'easy', 'college', ['team', 'work', 'together', 'assignment'], ['academic']),
  w('Hostel Life', 'easy', 'college', ['dorm', 'room', 'stay', 'campus'], ['culture']),
  w('Viva Voce', 'hard', 'college', ['oral', 'exam', 'question', 'answer', 'speak'], ['academic']),
  w('Dean\'s List', 'moderate', 'college', ['top', 'grade', 'honor', 'academic'], ['academic']),
  w('Fresher', 'easy', 'college', ['new', 'first', 'year', 'student'], ['culture']),
  w('Dissertation', 'hard', 'college', ['thesis', 'research', 'paper', 'write', 'long'], ['academic']),

  // ── MBA / CONSULTING ──
  w('Synergy', 'moderate', 'consulting', ['together', 'combine', 'better'], ['buzzword']),
  w('Pivot', 'easy', 'consulting', ['change', 'direction', 'strategy'], ['startup']),
  w('ROI', 'moderate', 'consulting', ['return', 'invest', 'profit', 'money'], ['finance']),
  w('Stakeholder', 'moderate', 'consulting', ['involved', 'interest', 'party', 'person'], ['business']),
  w('Due Diligence', 'hard', 'consulting', ['check', 'investigate', 'careful', 'research'], ['finance']),
  w('Disruption', 'moderate', 'consulting', ['change', 'industry', 'new', 'break'], ['innovation']),
  w('Value Proposition', 'hard', 'consulting', ['offer', 'benefit', 'customer', 'value', 'why'], ['strategy']),
  w('Market Cap', 'moderate', 'consulting', ['value', 'company', 'stock', 'total'], ['finance']),
  w('Bootstrapping', 'hard', 'consulting', ['self', 'fund', 'start', 'own', 'money'], ['startup']),
  w('Unicorn', 'moderate', 'consulting', ['startup', 'billion', 'valuation', 'rare'], ['startup']),
  w('Burn Rate', 'hard', 'consulting', ['spend', 'money', 'month', 'cash', 'fast'], ['startup']),
  w('IPO', 'moderate', 'consulting', ['public', 'stock', 'offer', 'first', 'market'], ['finance']),

  // ── GAMING ──
  w('Respawn', 'easy', 'gaming', ['die', 'again', 'come back', 'life'], ['fps']),
  w('Battle Royale', 'easy', 'gaming', ['last', 'survive', 'players', 'zone'], ['genre']),
  w('Speedrun', 'moderate', 'gaming', ['fast', 'complete', 'record', 'time'], ['challenge']),
  w('Easter Egg', 'moderate', 'gaming', ['hidden', 'secret', 'find', 'surprise'], ['feature']),
  w('Nerf', 'moderate', 'gaming', ['weaken', 'reduce', 'update', 'balance'], ['meta']),
  w('Meta', 'hard', 'gaming', ['best', 'strategy', 'optimal', 'current', 'effective'], ['competitive']),
  w('Rage Quit', 'easy', 'gaming', ['angry', 'leave', 'lose', 'game'], ['behavior']),
  w('NPC', 'moderate', 'gaming', ['character', 'computer', 'controlled', 'non-player'], ['rpg']),
  w('Lag', 'easy', 'gaming', ['slow', 'delay', 'connection', 'freeze'], ['technical']),
  w('Griefing', 'hard', 'gaming', ['annoy', 'troll', 'ruin', 'teammate', 'sabotage'], ['behavior']),
  w('Pay-to-Win', 'moderate', 'gaming', ['money', 'advantage', 'buy', 'unfair'], ['monetization']),
  w('RNG', 'hard', 'gaming', ['random', 'luck', 'chance', 'number', 'generate'], ['mechanic']),

  // ── MEMES / INTERNET ──
  w('Rickroll', 'easy', 'memes', ['trick', 'link', 'video', 'music'], ['classic']),
  w('Clickbait', 'easy', 'memes', ['title', 'exaggerate', 'click', 'article'], ['web']),
  w('Ghosting', 'easy', 'memes', ['ignore', 'message', 'disappear', 'reply'], ['social']),
  w('Flex', 'easy', 'memes', ['show off', 'brag', 'display'], ['slang']),
  w('Simp', 'moderate', 'memes', ['obsess', 'person', 'desperate', 'attention'], ['slang']),
  w('Based', 'hard', 'memes', ['opinion', 'bold', 'agree', 'unafraid'], ['slang']),
  w('Touch Grass', 'moderate', 'memes', ['outside', 'real', 'life', 'go', 'nature'], ['slang']),
  w('Ratio', 'hard', 'memes', ['reply', 'more', 'likes', 'comment', 'win'], ['twitter']),
  w('Main Character', 'moderate', 'memes', ['center', 'attention', 'protagonist', 'ego'], ['slang']),
  w('Cancel Culture', 'hard', 'memes', ['boycott', 'accountability', 'public', 'shame', 'online'], ['social']),
  w('Doomscrolling', 'moderate', 'memes', ['phone', 'news', 'bad', 'scroll', 'endless'], ['behavior']),
  w('Gaslighting', 'hard', 'memes', ['manipulate', 'doubt', 'crazy', 'reality', 'question'], ['psychology']),

  // ── INDIAN CULTURE ──
  w('Jugaad', 'easy', 'indian', ['hack', 'fix', 'creative', 'solution'], ['concept']),
  w('Chai', 'easy', 'indian', ['tea', 'drink', 'hot', 'milk'], ['food']),
  w('Diwali', 'easy', 'indian', ['festival', 'lights', 'crackers'], ['festival']),
  w('Auto Rickshaw', 'easy', 'indian', ['three', 'wheel', 'ride', 'vehicle'], ['transport']),
  w('Arranged Marriage', 'moderate', 'indian', ['parents', 'family', 'wedding', 'match'], ['culture']),
  w('Bollywood Dance', 'easy', 'indian', ['movie', 'song', 'choreography', 'Hindi'], ['entertainment']),
  w('IIT', 'moderate', 'indian', ['engineering', 'exam', 'college', 'top', 'institute'], ['education']),
  w('Cricket IPL', 'easy', 'indian', ['match', 'team', 'T20', 'league'], ['sport']),
  w('Holi', 'easy', 'indian', ['color', 'festival', 'water', 'spring'], ['festival']),
  w('Sharma Ji Ka Beta', 'hard', 'indian', ['comparison', 'neighbor', 'son', 'parents', 'better'], ['culture']),
  w('Quarter Life Crisis', 'hard', 'indian', ['age', 'confusion', 'career', 'life', 'twenties'], ['concept']),
  w('Ragging', 'moderate', 'indian', ['senior', 'bully', 'college', 'new', 'student'], ['education']),

  // ── FINANCE / DATA ──
  w('Spreadsheet', 'easy', 'finance', ['excel', 'table', 'data', 'cells'], ['tool']),
  w('Pivot Table', 'moderate', 'finance', ['excel', 'summarize', 'data', 'group'], ['tool']),
  w('VLOOKUP', 'moderate', 'finance', ['excel', 'search', 'find', 'column', 'match'], ['function']),
  w('Dashboard', 'easy', 'finance', ['visual', 'chart', 'data', 'display'], ['analytics']),
  w('KPI', 'moderate', 'finance', ['metric', 'performance', 'key', 'indicator', 'measure'], ['business']),
  w('Compound Interest', 'moderate', 'finance', ['money', 'grow', 'interest', 'time'], ['finance']),
  w('Bear Market', 'hard', 'finance', ['stock', 'fall', 'decline', 'negative', 'down'], ['market']),
  w('Hedge Fund', 'hard', 'finance', ['invest', 'rich', 'risk', 'fund', 'strategy'], ['investment']),
  w('Inflation', 'moderate', 'finance', ['price', 'increase', 'money', 'value', 'less'], ['economics']),
  w('GDP', 'moderate', 'finance', ['country', 'economy', 'total', 'output', 'gross'], ['economics']),
  w('Regression', 'hard', 'finance', ['predict', 'line', 'data', 'trend', 'statistics'], ['analytics']),
  w('Black Swan', 'insane', 'finance', ['rare', 'unpredictable', 'impact', 'event', 'extreme'], ['concept']),
];

// Get words by category
export function getWordsByCategory(category: string): WordEntry[] {
  return WORD_DATABASE.filter(w => w.category === category);
}

// Get words by difficulty
export function getWordsByDifficulty(difficulty: Difficulty): WordEntry[] {
  return WORD_DATABASE.filter(w => w.difficulty === difficulty);
}

// Get all categories
export function getAllCategories(): string[] {
  return Array.from(new Set(WORD_DATABASE.map(w => w.category)));
}

// Get random words for a board
export function generateBoardWords(
  categories: string[],
  distribution: Record<Difficulty, number>,
  excludeIds: string[] = []
): WordEntry[] {
  const result: WordEntry[] = [];
  const available = WORD_DATABASE.filter(
    w => categories.includes(w.category) && !excludeIds.includes(w.id)
  );

  for (const [diff, count] of Object.entries(distribution) as [Difficulty, number][]) {
    const pool = available.filter(w => w.difficulty === diff && !result.includes(w));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    result.push(...shuffled.slice(0, count));
  }

  return result.sort(() => Math.random() - 0.5);
}
