// Screen dimensions
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

// Brick grid
export const BRICK_COLS = 10;
export const BRICK_ROWS = 8;
export const BRICK_W = 44;
export const BRICK_H = 16;
export const BRICK_PAD = 2;

// Brick layout origin (top-left of brick grid)
export const BRICK_OFFSET_X = 8;
export const BRICK_OFFSET_Y = 80;

// Brick type IDs
export const BRICK_TYPE = {
  EMPTY:   0,
  RED:     1,
  ORANGE:  2,
  YELLOW:  3,
  GREEN:   4,
  BLUE:    5,
  PURPLE:  6,
  SILVER:  7,
  GOLD:    8,
  SPECIAL: 9,
};

// Brick colors (hex numbers for Phaser Graphics)
export const BRICK_COLOR = {
  [BRICK_TYPE.RED]:     0xFF4444,
  [BRICK_TYPE.ORANGE]:  0xFF8C00,
  [BRICK_TYPE.YELLOW]:  0xFFD700,
  [BRICK_TYPE.GREEN]:   0x44CC44,
  [BRICK_TYPE.BLUE]:    0x4488FF,
  [BRICK_TYPE.PURPLE]:  0xAA44FF,
  [BRICK_TYPE.SILVER]:  0xAAAAAA,
  [BRICK_TYPE.GOLD]:    0xFFCC00,
  [BRICK_TYPE.SPECIAL]: 0xFF44FF,
};

// Brick hit points
export const BRICK_HP = {
  [BRICK_TYPE.RED]:     1,
  [BRICK_TYPE.ORANGE]:  1,
  [BRICK_TYPE.YELLOW]:  1,
  [BRICK_TYPE.GREEN]:   1,
  [BRICK_TYPE.BLUE]:    1,
  [BRICK_TYPE.PURPLE]:  1,
  [BRICK_TYPE.SILVER]:  2,
  [BRICK_TYPE.GOLD]:    Infinity,
  [BRICK_TYPE.SPECIAL]: 1,
};

// Score per brick type
export const BRICK_SCORE = {
  [BRICK_TYPE.RED]:     100,
  [BRICK_TYPE.ORANGE]:  200,
  [BRICK_TYPE.YELLOW]:  300,
  [BRICK_TYPE.GREEN]:   400,
  [BRICK_TYPE.BLUE]:    500,
  [BRICK_TYPE.PURPLE]:  600,
  [BRICK_TYPE.SILVER]:  700,
  [BRICK_TYPE.GOLD]:    0,
  [BRICK_TYPE.SPECIAL]: 1000,
};

// Power-up types
export const POWERUP_TYPE = {
  SLOW:  'SLOW',
  WIDE:  'WIDE',
  LASER: 'LASER',
  MULTI: 'MULTI',
  LIFE:  'LIFE',
};

// Power-up colors
export const POWERUP_COLOR = {
  [POWERUP_TYPE.SLOW]:  0xFF8C00,
  [POWERUP_TYPE.WIDE]:  0x4488FF,
  [POWERUP_TYPE.LASER]: 0xFF4444,
  [POWERUP_TYPE.MULTI]: 0x00FFFF,
  [POWERUP_TYPE.LIFE]:  0x44CC44,
};

// Power-up durations in milliseconds (0 = permanent)
export const POWERUP_DURATION = {
  [POWERUP_TYPE.SLOW]:  8000,
  [POWERUP_TYPE.WIDE]:  10000,
  [POWERUP_TYPE.LASER]: 10000,
  [POWERUP_TYPE.MULTI]: 0,
  [POWERUP_TYPE.LIFE]:  0,
};

// Physics
export const BALL_SPEED_INITIAL = 300;
export const BALL_SPEED_MAX     = 600;
export const POWERUP_FALL_SPEED = 150;

// Speed level system (multiplier = speedLevel / SPEED_LEVEL_DEFAULT)
export const SPEED_LEVEL_DEFAULT = 10;
export const SPEED_LEVEL_MIN     = 1;
export const SPEED_LEVEL_MAX     = 20;
export const PADDLE_DEPTH       = 10;

// Paddle
export const PADDLE_W    = 80;
export const PADDLE_H    = 12;
export const PADDLE_Y    = GAME_HEIGHT - 48;

// Game
export const LIVES_START = 3;

// HUD height (pixels reserved at the top for score/lives/level)
export const HUD_HEIGHT = 28;

// Scene keys
export const SCENE = {
  BOOT:   'BootScene',
  MENU:   'MenuScene',
  GAME:   'GameScene',
  UI:     'UIScene',
};
