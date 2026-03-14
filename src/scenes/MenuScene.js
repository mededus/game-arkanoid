import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE } from '../constants.js';

const TITLE = 'ARKANOID';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.MENU });
  }

  create() {
    this._createStarfield();
    this._createDemoBall();
    this._createTitle();
    this._createPressToPlay();
    this._createStartInput();
  }

  update() {
    this._updateDemoBall();
  }

  _createStarfield() {
    const g = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator(['arkanoid-stars']);
    for (let i = 0; i < 80; i++) {
      const x = rng.integerInRange(0, GAME_WIDTH);
      const y = rng.integerInRange(0, GAME_HEIGHT);
      const brightness = rng.integerInRange(80, 220);
      const size = rng.pick([1, 1, 1, 2]);
      const color = Phaser.Display.Color.GetColor(brightness, brightness, brightness);
      g.fillStyle(color, rng.realInRange(0.4, 1));
      g.fillRect(x, y, size, size);
    }
  }

  _createDemoBall() {
    this._ball = this.add.image(GAME_WIDTH * 0.25, GAME_HEIGHT * 0.55, 'ball').setAlpha(0.55);
    this._ballVX = 220;
    this._ballVY = -160;
  }

  _updateDemoBall() {
    const dt = this.game.loop.delta / 1000;
    const b = this._ball;
    b.x += this._ballVX * dt;
    b.y += this._ballVY * dt;
    const hw = b.width / 2; const hh = b.height / 2;
    if (b.x - hw < 0) { b.x = hw; this._ballVX = Math.abs(this._ballVX); }
    else if (b.x + hw > GAME_WIDTH) { b.x = GAME_WIDTH - hw; this._ballVX = -Math.abs(this._ballVX); }
    if (b.y - hh < 0) { b.y = hh; this._ballVY = Math.abs(this._ballVY); }
    else if (b.y + hh > GAME_HEIGHT) { b.y = GAME_HEIGHT - hh; this._ballVY = -Math.abs(this._ballVY); }
  }

  _createTitle() {
    const cx = GAME_WIDTH / 2; const baseY = GAME_HEIGHT * 0.28;
    const letterW = 38; const totalW = TITLE.length * letterW;
    const startX = cx - totalW / 2 + letterW / 2;
    const colors = ['#FF4444', '#FF8C00', '#FFD700', '#44CC44', '#4488FF', '#AA44FF', '#FF4444', '#FF8C00'];
    this._letters = [];
    for (let i = 0; i < TITLE.length; i++) {
      const letter = this.add.text(startX + i * letterW, -60, TITLE[i], { fontSize: '40px', fontFamily: 'monospace', color: colors[i], stroke: '#000000', strokeThickness: 4, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true } }).setOrigin(0.5, 0.5);
      this._letters.push(letter);
      this.tweens.add({ targets: letter, y: baseY, ease: 'Bounce.Out', duration: 700, delay: 80 * i });
    }
    const floatDelay = 80 * TITLE.length + 700 + 200;
    this.time.delayedCall(floatDelay, () => {
      this._letters.forEach((letter, i) => {
        this.tweens.add({ targets: letter, y: baseY + 6, ease: 'Sine.InOut', duration: 1400, delay: 80 * i, yoyo: true, repeat: -1 });
      });
    });
  }

  _createPressToPlay() {
    this._prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 'PRESS TO PLAY', { fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 0.5).setAlpha(0);
    const delay = 80 * TITLE.length + 700 + 400;
    this.time.delayedCall(delay, () => {
      this.tweens.add({ targets: this._prompt, alpha: 1, ease: 'Linear', duration: 400, onComplete: () => {
        this.tweens.add({ targets: this._prompt, alpha: 0, ease: 'Linear', duration: 500, yoyo: true, repeat: -1, hold: 300 });
      }});
    });
  }

  _createStartInput() {
    this.time.delayedCall(300, () => { this._inputReady = true; });
    this.input.on('pointerdown', () => { if (this._inputReady) this._startGame(); });
    this.input.keyboard.on('keydown', () => { if (this._inputReady) this._startGame(); });
  }

  _startGame() {
    this._inputReady = false;
    this.cameras.main.flash(300, 255, 255, 255, false, () => { this.scene.start(SCENE.GAME); });
  }
}
