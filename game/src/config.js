// Solmar Nights v2 — every tuning number, colour and story constant in one
// place. Nothing here depends on screen size: the world is a fixed
// 3200x2400 city and the camera follows Mara through it.

export const STEP = 1 / 60;
export const WORLD = { width: 3200, height: 2400 };
export const ROAD_SPACING = 320;
export const ROAD_HALF = 34;

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
  accel: 420,
  brake: 700,
  maxSpeed: 460,
  maxReverse: 140,
  turnRate: 2.6,
  trafficSpeed: 130,
  // Police get faster as the heat rises: 410 + 15 per star, capped at 480.
  policeBaseSpeed: 410,
  policePerStar: 15,
  policeMaxSpeed: 480,
};

export const WANTED_MAX = 5;
export const HIDE_SECONDS_PER_STAR = 6;
export const COIN_VALUE = 25;

export const PALETTE = {
  ground: '#c9a86a',
  grass: '#7fae5a',
  park: '#5d9e4a',
  sand: '#e8d39a',
  sea: '#3f8fb5',
  road: '#3a3f47',
  roadLine: '#e8d44d',
  sidewalk: '#b8b2a4',
  player: '#ff5a4e',
  police: '#2f6fd0',
  taxi: '#f2c94c',
  panel: 'rgba(12,18,28,0.78)',
  text: '#f5f1e6',
  muted: '#c9c2ae',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#7ed07e',
  tree: '#4d8a3f',
  palm: '#3f9e5a',
  // One colour per building kind, so the city reads as a place, not a grid.
  building: {
    casa: ['#e07856', '#e8a54b', '#d9c27a'],
    tienda: ['#5b8fb0', '#8fb05b', '#b06a8f'],
    oficina: ['#6a7fb0', '#7ab0a0', '#9b7ede'],
    torre: ['#4d6f8f', '#7a6a9b', '#5b8f7a'],
    bodega: ['#a07a4d', '#8f7a5b', '#b08a6a'],
    hotel: ['#e8c9a0', '#d9a05b', '#c97e6a'],
    container: ['#c96a3b', '#3b7ac9', '#5ba03b', '#c9a03b'],
  },
  traffic: ['#e8e8e8', '#f2c94c', '#4fc3f7', '#9b7ede', '#7ed07e', '#d07e7e'],
  ped: ['#f2e6c9', '#c9d6f2', '#f2c9d6', '#d6f2c9', '#e8d6b0', '#d6c9f2'],
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const SAVE_KEY = 'solmar-nights.save.v2';
export const BEST_KEY = 'solmar-nights.best';

export const STORY = {
  title: 'SOLMAR NIGHTS',
  subtitle: 'Una ciudad, una deuda, cuatro encargos.',
  intro: 'Mara Vega debe $1,500 a El Corvo, el fixer del puerto. Cuatro encargos por la ciudad de Solmar: recoge, entrega, huye de la policía y paga tu deuda.',
  debt: 1500,
};

// Four chained jobs. The first three pay the $1,500 debt; the fourth is a
// bonus night job once Mara is free. Rewards: 300 + 500 + 800 = $1,600.
export const MISSIONS = [
  {
    id: 1, name: 'Primer encargo', kind: 'delivery',
    brief: 'Recoge el paquete en el mercado y entrégalo en el muelle. Tienes 90 segundos.',
    pickup: { x: 640, y: 480 }, drop: { x: 2880, y: 2080 },
    timeLimit: 90, reward: 300,
    dialog: 'El Corvo: "Primer encargo, Mara. Paquete en el mercado, entrega en el muelle. Sin preguntas."',
  },
  {
    id: 2, name: 'La fuga', kind: 'getaway',
    brief: 'Recoge a Luz en la plaza y llévala al refugio del puerto viejo. La policía ya te busca: nivel 2.',
    pickup: { x: 1600, y: 1120 }, drop: { x: 320, y: 2080 },
    timeLimit: 120, reward: 500, startWanted: 2,
    dialog: 'Luz: "¡Mara, rápido! Los azules me siguen. Llévame al refugio del puerto viejo."',
  },
  {
    id: 3, name: 'El último pago', kind: 'chase',
    brief: 'Lleva el maletín al faro y pierde a la policía. Nivel 3. Entrega y la deuda queda pagada.',
    pickup: { x: 960, y: 1760 }, drop: { x: 2880, y: 320 },
    timeLimit: 150, reward: 800, startWanted: 3,
    dialog: 'El Corvo: "Último encargo. El maletín al faro. Si te atrapan, yo no te conozco."',
  },
  {
    id: 4, name: 'Noche libre', kind: 'bonus',
    brief: 'Deuda pagada. Un último trabajo por tu cuenta: lleva el encargo al hotel Miramar. 120 segundos, $400.',
    pickup: { x: 2880, y: 1760 }, drop: { x: 320, y: 320 },
    timeLimit: 120, reward: 400,
    dialog: 'El Corvo: "Deuda saldada, Mara. Este último es para ti. Hotel Miramar, azotea. Y después, Solmar es tuya."',
  },
];
