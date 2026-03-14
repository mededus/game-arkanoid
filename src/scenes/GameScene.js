import Phaser from 'phaser';
import {
  SCENE,
  GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT,
  PADDLE_W, PADDLE_H, PADDLE_Y,
  BRICK_COLS, BRICK_W, BRICK_H, BRICK_PAD, BRICK_OFFSET_X, BRICK_OFFSET_Y,
  BRICK_TYPE, BRICK_HP, BRICK_SCORE,
  POWERUP_TYPE,
  BALL_SPEED_INITIAL,
  SPEED_LEVEL_DEFAULT, SPEED_LEVEL_MIN, SPEED_LEVEL_MAX,
  LIVES_START,
} from '../constants.js';
import LEVELS from '../levels/index.js';
import { PowerUpManager } from '../objects/PowerUp.js';
import { AudioManager }  from '../objects/AudioManager.js';

const BALL_RADIUS = 7;
const BALL_TEX_SIZE = BALL_RADIUS * 2 + 2;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.GAME });
  }

  init(data) {
    this._level      = data.level      ?? 1;
    this._score      = data.score      ?? 0;
    this._lives      = data.lives      ?? LIVES_START;
    this._speedLevel = data.speedLevel ?? SPEED_LEVEL_DEFAULT;
    this._ending     = false;
  }

  create() {
    this.physics.world.setBounds(0, HUD_HEIGHT, GAME_WIDTH, GAME_HEIGHT - HUD_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.physics.world.on('worldbounds', (_body, up, _down, left, right) => {
      if (left || right) this.cameras.main.shake(35, 0.0025);
      if (left || right || up) this._audio.playWallHit();
    });

    this._audio = new AudioManager(this);
    this.events.once('shutdown', () => this._audio.destroy());

    this._makeBackground();

    this._paddle = this.physics.add.image(GAME_WIDTH / 2, PADDLE_Y, 'paddle');
    this._paddle.setImmovable(true);
    this._paddle.body.allowGravity = false;

    this._bricks   = this.physics.add.staticGroup();
    this._powerUps = this.physics.add.group();
    this._lasers   = this.physics.add.group();

    this._buildLevel();

    this._powerUpManager = new PowerUpManager(this);

    this._balls = [];
    this._spawnBallOnPaddle();

    this.input.on('pointermove', (ptr) => this._movePaddle(ptr.x));
    this.input.on('pointerdown', (ptr) => this._handleClick(ptr));
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.keyboard.on('keydown-PLUS',            () => this._changeSpeed(1));
    this.input.keyboard.on('keydown-NUMPAD_ADD',      () => this._changeSpeed(1));
    this.input.keyboard.on('keydown-MINUS',           () => this._changeSpeed(-1));
    this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this._changeSpeed(-1));

    this.physics.add.overlap(this._paddle, this._powerUps, (_pad, pu) => this._collectPowerUp(pu));
    this.physics.add.overlap(this._lasers, this._bricks, (laser, brick) => this._onLaserHitBrick(laser, brick));

    this.scene.launch(SCENE.UI);
    this._emitHUD();
  }

  update() {
    if (this._ending) return;
    this._updateBalls();
    this._cleanupOffScreen();
    this._checkBallsLost();
  }

  _makeBackground() {
    const g = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator([`level-${this._level}`]);
    for (let i = 0; i < 160; i++) {
      const x    = rng.integerInRange(1, GAME_WIDTH - 1);
      const y    = rng.integerInRange(HUD_HEIGHT + 1, GAME_HEIGHT - 1);
      const size = rng.frac() < 0.15 ? 2 : 1;
      g.fillStyle(0xffffff, rng.realInRange(0.15, 0.65));
      g.fillRect(x, y, size, size);
    }
    g.lineStyle(1, 0x334455, 1);
    g.lineBetween(0, HUD_HEIGHT, GAME_WIDTH, HUD_HEIGHT);
    g.lineStyle(1, 0x224466, 0.9);
    g.strokeRect(1, HUD_HEIGHT, GAME_WIDTH - 2, GAME_HEIGHT - HUD_HEIGHT - 1);
  }

  _buildLevel() {
    const layout = LEVELS[this._level - 1];
    layout.forEach((row, rowIdx) => {
      row.forEach((typeId, colIdx) => {
        if (typeId === BRICK_TYPE.EMPTY) return;
        const x = BRICK_OFFSET_X + colIdx * (BRICK_W + BRICK_PAD) + BRICK_W / 2;
        const y = BRICK_OFFSET_Y + rowIdx * (BRICK_H + BRICK_PAD) + BRICK_H / 2;
        const sprite = this._bricks.create(x, y, `brick_${typeId}`);
        sprite.brickType  = typeId;
        sprite.brickHp    = BRICK_HP[typeId];
        sprite.hasPowerUp = (typeId === BRICK_TYPE.SPECIAL);
        sprite.refreshBody();
      });
    });
  }

  _movePaddle(x) {
    const halfW = this._paddle.displayWidth / 2;
    this._paddle.x = Phaser.Math.Clamp(x, halfW, GAME_WIDTH - halfW);
    this._paddle.body.reset(this._paddle.x, PADDLE_Y);
    const stuckBall = this._balls.find((b) => b._onPaddle);
    if (stuckBall) stuckBall.x = this._paddle.x;
  }

  _spawnBallOnPaddle() {
    const ball = this._createBall(this._paddle.x, PADDLE_Y - PADDLE_H / 2 - BALL_RADIUS - 1);
    ball._onPaddle = true;
    ball.body.setVelocity(0, 0);
    ball._wobble = this.tweens.add({ targets: ball, y: ball.y - 3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _createBall(x, y) {
    const ball = this.physics.add.image(x, y, 'ball');
    ball.setCircle(BALL_RADIUS, 1, 1);
    ball.setBounce(1, 1);
    ball.setCollideWorldBounds(true);
    ball.body.allowGravity = false;
    ball.body.onWorldBounds = true;
    ball._speed    = BALL_SPEED_INITIAL * (this._speedLevel / SPEED_LEVEL_DEFAULT);
    ball._onPaddle = false;
    ball._trail = this.add.particles(ball.x, ball.y, 'particle', { follow: ball, scale: { start: 0.7, end: 0 }, alpha: { start: 0.45, end: 0 }, lifespan: 180, frequency: 25, speed: { min: 0, max: 15 }, tint: 0xaaddff, emitting: false });
    this.physics.add.collider(ball, this._bricks,  (b, brick) => this._onBrickHit(b, brick));
    this.physics.add.collider(ball, this._paddle,  (b, pad)   => this._onPaddleHit(b, pad));
    this._balls.push(ball);
    return ball;
  }

  _launchBall(ball) {
    ball._onPaddle = false;
    if (ball._wobble) { ball._wobble.stop(); ball._wobble = null; ball.y = PADDLE_Y - PADDLE_H / 2 - BALL_RADIUS - 1; }
    if (ball._trail) ball._trail.start();
    const angleDeg = Phaser.Math.Between(-65, -115);
    const rad = Phaser.Math.DegToRad(angleDeg);
    ball.body.setVelocity(Math.cos(rad) * ball._speed, Math.sin(rad) * ball._speed);
  }

  _handleClick(ptr) {
    if (ptr && ptr.y < 58) return;
    const stuck = this._balls.find((b) => b._onPaddle);
    if (stuck) { this._launchBall(stuck); return; }
    if (this._powerUpManager.laserActive) this._fireLasers();
  }

  _updateBalls() {
    for (const ball of this._balls) {
      if (!ball.active || ball._onPaddle) continue;
      const vel = ball.body.velocity;
      const spd = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      if (spd > 0 && Math.abs(spd - ball._speed) > 2) { const f = ball._speed / spd; ball.body.setVelocity(vel.x * f, vel.y * f); }
      if (Math.abs(vel.y) < 30) { const sign = vel.y < 0 ? -1 : 1; ball.body.setVelocityY(sign * 80); }
    }
  }

  _cleanupOffScreen() {
    for (const pu of this._powerUps.getChildren()) { if (pu.y > GAME_HEIGHT + 20) pu.destroy(); }
    for (const l  of this._lasers.getChildren())   { if (l.y  < -20)              l.destroy(); }
  }

  _checkBallsLost() {
    this._balls = this._balls.filter((ball) => {
      if (!ball.active) return false;
      if (ball.y > GAME_HEIGHT + 20) {
        if (ball._wobble) ball._wobble.stop();
        if (ball._trail)  { ball._trail.stop(); ball._trail.destroy(); }
        ball.destroy();
        return false;
      }
      return true;
    });
    if (this._balls.length === 0) this._onAllBallsLost();
  }

  _onPaddleHit(ball, paddle) {
    const rel   = (ball.x - paddle.x) / (paddle.displayWidth / 2);
    const angle = Phaser.Math.DegToRad(-90 + rel * 60);
    ball.body.setVelocity(Math.cos(angle) * ball._speed, Math.sin(angle) * ball._speed);
    this.cameras.main.shake(50, 0.003);
    this._audio.playPaddleHit();
  }

  _onBrickHit(ball, brick) {
    const destroyed = this._damageBrick(brick);
    if (!destroyed) { this.tweens.add({ targets: brick, alpha: 0.3, duration: 60, yoyo: true }); this._audio.playBrickHit(); }
  }

  _onLaserHitBrick(laser, brick) {
    laser.destroy();
    this._damageBrick(brick);
  }

  _damageBrick(brick) {
    if (!brick.active) return false;
    if (brick.brickHp === Infinity) return false;
    brick.brickHp--;
    if (brick.brickHp <= 0) {
      const mult = this._speedLevel / SPEED_LEVEL_DEFAULT;
      this._score += Math.round(BRICK_SCORE[brick.brickType] * mult);
      this._emitHUD();
      this._burstAt(brick.x, brick.y);
      if (brick.hasPowerUp) this._spawnPowerUp(brick.x, brick.y);
      this._audio.playBrickDestroy();
      brick.destroy();
      this._checkLevelClear();
      return true;
    }
    if (brick.brickType === BRICK_TYPE.SILVER) { brick.setTexture('brick_7_hit'); brick.refreshBody(); }
    return false;
  }

  _spawnPowerUp(x, y) {
    const types = Object.values(POWERUP_TYPE);
    const type  = Phaser.Utils.Array.GetRandom(types);
    const pu    = this.physics.add.image(x, y, `powerup_${type}_labeled`);
    pu.powerUpType = type;
    this._powerUps.add(pu);
    pu.body.allowGravity = false;
    pu.body.setVelocity(0, 150);
  }

  _collectPowerUp(pu) {
    const type = pu.powerUpType;
    pu.destroy();
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.25).setOrigin(0, 0).setDepth(50);
    this.tweens.add({ targets: flash, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
    this._audio.playPowerUp();
    const handled = this._powerUpManager.apply(type);
    if (!handled && type === POWERUP_TYPE.LIFE) { this._lives = Math.min(this._lives + 1, 9); this._emitHUD(); }
  }

  _fireLasers() {
    const offX = this._paddle.displayWidth * 0.35;
    const y    = PADDLE_Y - PADDLE_H - 2;
    for (const x of [this._paddle.x - offX, this._paddle.x + offX]) {
      const laser = this.physics.add.image(x, y, 'particle');
      laser.setDisplaySize(3, 14);
      laser.setTint(0xff4444);
      laser.body.allowGravity = false;
      this._lasers.add(laser);
      laser.body.setVelocity(0, -550);
    }
    this._audio.playLaserFire();
  }

  _changeSpeed(delta) {
    if (this._ending) return;
    this._speedLevel = Phaser.Math.Clamp(this._speedLevel + delta, SPEED_LEVEL_MIN, SPEED_LEVEL_MAX);
    const newSpeed = BALL_SPEED_INITIAL * (this._speedLevel / SPEED_LEVEL_DEFAULT);
    for (const ball of this._balls) ball._speed = newSpeed;
    this._normalizeBallSpeeds();
    this._emitHUD();
  }

  _normalizeBallSpeeds() {
    for (const ball of this._balls) {
      if (ball._onPaddle || !ball.body) continue;
      const vel = ball.body.velocity;
      const spd = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      if (spd > 0) { const f = ball._speed / spd; ball.body.setVelocity(vel.x * f, vel.y * f); }
    }
  }

  _burstAt(x, y) {
    const emitter = this.add.particles(x, y, 'particle', { speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 }, scale: { start: 1.5, end: 0 }, lifespan: 380, quantity: 10, maxParticles: 10, gravityY: 250 });
    this.time.delayedCall(500, () => { if (emitter.active) emitter.destroy(); });
  }

  _onAllBallsLost() {
    this._ending = true;
    this._lives--;
    this._emitHUD();
    this._audio.playLifeLost();
    if (this._lives <= 0) { this.time.delayedCall(400, () => this._showGameOver()); }
    else { this.time.delayedCall(600, () => { this._ending = false; this._spawnBallOnPaddle(); }); }
  }

  _checkLevelClear() {
    const breakable = this._bricks.getChildren().filter((b) => b.brickType !== BRICK_TYPE.GOLD);
    if (breakable.length === 0) {
      this._ending = true;
      this._audio.playLevelComplete();
      this.time.delayedCall(900, () => this._levelComplete());
    }
  }

  _levelComplete() {
    this.scene.stop(SCENE.UI);
    if (this._level < LEVELS.length) { this.scene.start(SCENE.GAME, { level: this._level + 1, score: this._score, lives: this._lives, speedLevel: this._speedLevel }); }
    else { this._showWin(); }
  }

  _showOverlay(bgColor, title, titleColor) {
    this._balls.forEach((b) => { if (b.body) b.body.setVelocity(0, 0); });
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300, 180, bgColor, 0.92).setDepth(20);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, title, { fontSize: '30px', fontFamily: 'monospace', color: titleColor }).setOrigin(0.5).setDepth(21);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `SCORE  ${this._score}`, { fontSize: '18px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '[ PLAY AGAIN ]', { fontSize: '16px', fontFamily: 'monospace', color: '#aaffaa' }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#aaffaa'));
    btn.on('pointerdown', () => { this.scene.stop(SCENE.UI); this.scene.start(SCENE.MENU); });
  }

  _showGameOver() { this._showOverlay(0x220000, 'GAME OVER', '#ff4444'); }
  _showWin()      { this._showOverlay(0x002200, 'YOU WIN!',  '#44ff44'); }

  _emitHUD() {
    this.events.emit('score',      this._score);
    this.events.emit('lives',      this._lives);
    this.events.emit('level',      this._level);
    this.events.emit('speedLevel', this._speedLevel);
  }
}
