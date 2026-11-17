// Solmar Nights — every tuning number, colour and city constant in one place.
// The world is a fixed 3200x2400 open city; the camera follows the player and the
// renderer scales the canvas to the window, so no rule depends on screen size.

export const STEP = 1 / 60;
export const WORLD = { width: 3200, height: 2400 };
export const ROAD_SPACING = 320;
export const ROAD_HALF = 34;
export const BLOCK = 252; // block size between roads

export const PLAYER = {
  radius: 13,
  walkSpeed: 170,
  runSpeed: 260,
  healthMax: 100,
  punchRange: 46,
  punchDamage: 34,
  punchCooldown: 0.45,
};

export const CAR = {
  length: 54,
  width: 26,
  accel: 420,
  brake: 700,
  maxSpeed: 460,
  maxReverse: 140,
  turnRate: 2.6,
  trafficSpeed: 130,
  policeSpeed: 430,
};

export const WANTED_MAX = 5;

export const PALETTE = {
  ground: '#c9a86a',
  grass: '#7fae5a',
  sand: '#e8d39a',
  sea: '#3f8fb5',
  road: '#3a3f47',
  roadLine: '#e8d44d',
  sidewalk: '#b8b2a4',
  building: ['#e07856', '#e8a54b', '#5b8fb0', '#8fb05b', '#b06a8f', '#6a7fb0', '#d9c27a', '#7ab0a0'],
  roof: '#00000022',
  player: '#ff5a4e',
  playerCar: '#ff5a4e',
  police: '#2f6fd0',
  traffic: ['#e8e8e8', '#f2c94c', '#4fc3f7', '#9b7ede', '#7ed07e', '#d07e7e'],
  ped: ['#f2e6c9', '#c9d6f2', '#f2c9d6', '#d6f2c9', '#e8d6b0'],
  tree: '#4d8a3f',
  panel: 'rgba(12,18,28,0.78)',
  text: '#f5f1e6',
  muted: '#c9c2ae',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#7ed07e',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const SAVE_KEY = 'solmar-nights.save.v1';
export const BEST_KEY = 'solmar-nights.best';

export const STORY = {
  title: 'SOLMAR NIGHTS',
  subtitle: 'Una ciudad, una deuda, tres encargos.',
  intro: 'Mara Vega debe $1,500 a El Corvo, el fixer del puerto. Tres encargos y la deuda queda pagada. Roba un coche, esquiva a la policía y entrega a tiempo.',
  debt: 1500,
};

export const MISSIONS = [
  {
    id: 1, name: 'Primer encargo',
    brief: 'Recoge el paquete en el mercado y entrégalo en el muelle. Tienes 90 segundos.',
    pickup: { x: 640, y: 480 }, drop: { x: 2880, y: 2080 },
    timeLimit: 90, reward: 300,
    dialog: 'El Corvo: "Primer encargo, Mara. Paquete en el mercado, entrega en el muelle. Sin preguntas."',
  },
  {
    id: 2, name: 'La fuga',
    brief: 'Recoge a Luz en la plaza y llévala al refugio. La policía ya te busca: nivel 2.',
    pickup: { x: 1600, y: 1120 }, drop: { x: 320, y: 2080 },
    timeLimit: 120, reward: 500, startWanted: 2,
    dialog: 'Luz: "¡Mara, rápido! Los azules me siguen. Llévame al refugio del puerto viejo."',
  },
  {
    id: 3, name: 'El último pago',
    brief: 'Lleva el maletín al faro y pierde a la policía. Nivel 3. Entrega y la deuda queda pagada.',
    pickup: { x: 960, y: 1760 }, drop: { x: 2880, y: 320 },
    timeLimit: 150, reward: 800, startWanted: 3,
    dialog: 'El Corvo: "Último encargo. El maletín al faro. Si te atrapan, yo no te conozco."',
  },
];
