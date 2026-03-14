import Phaser from 'phaser';
import {
  PADDLE_W, PADDLE_H,
  BRICK_W, BRICK_H,
  BRICK_TYPE, BRICK_COLOR,
  POWERUP_TYPE, POWERUP_COLOR,
  SCENE,
} from '../constants.js';

const BALL_RADIUS = 7;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  create() {
    this._makePaddle();
    this._makeBall();
    this._makeBricks();
    this._makePowerUps();
    this._makeParticle();

    this.scene.start(SCENE.MENU);
  }

  _makePaddle() {
    const w = PADDLE_W;
    const h = PADDLE_H;
    const r = h / 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4488cc, 1);
    g.fillRoundedRect(0, 0, w, h, r);
    g.fillStyle(0x88ccff, 1);
    g.fillRoundedRect(2, 1, w - 4, 3, 1);
    g.fillStyle(0x224466, 1);
    g.fillRect(2, h - 3, w - 4, 2);
    g.generateTexture('paddle', w, h);
    g.destroy();
  }

  _makeBall() {
    const r = BALL_RADIUS;
    const size = r * 2 + 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(r + 1, r + 1, r);
    g.fillStyle(0xaaddff, 1);
    g.fillCircle(r - 1, r - 1, Math.floor(r * 0.45));
    g.generateTexture('ball', size, size);
    g.destroy();
  }

  _makeBricks() {
    const w = BRICK_W;
    const h = BRICK_H;
    const types = [BRICK_TYPE.RED, BRICK_TYPE.ORANGE, BRICK_TYPE.YELLOW, BRICK_TYPE.GREEN, BRICK_TYPE.BLUE, BRICK_TYPE.PURPLE, BRICK_TYPE.SILVER, BRICK_TYPE.GOLD, BRICK_TYPE.SPECIAL];
    for (const type of types) {
      const baseColor = BRICK_COLOR[type];
      const key = `brick_${type}`;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(baseColor, 1);
      g.fillRect(0, 0, w, h);
      const light = this._lighten(baseColor, 0.45);
      g.fillStyle(light, 1);
      g.fillRect(0, 0, w, 2);
      g.fillRect(0, 0, 2, h);
      const dark = this._darken(baseColor, 0.35);
      g.fillStyle(dark, 1);
      g.fillRect(0, h - 2, w, 2);
      g.fillRect(w - 2, 0, 2, h);
      if (type === BRICK_TYPE.GOLD) { g.fillStyle(0xffffff, 0.25); g.fillRect(4, 3, w - 8, 3); }
      if (type === BRICK_TYPE.SPECIAL) { g.lineStyle(1, 0xffffff, 0.6); g.strokeRect(3, 3, w - 6, h - 6); }
      g.generateTexture(key, w, h);
      g.destroy();
      if (type === BRICK_TYPE.SILVER) {
        const g2 = this.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0x666666, 1); g2.fillRect(0, 0, w, h);
        g2.fillStyle(0x888888, 1); g2.fillRect(0, 0, w, 2); g2.fillRect(0, 0, 2, h);
        g2.fillStyle(0x333333, 1); g2.fillRect(0, h - 2, w, 2); g2.fillRect(w - 2, 0, 2, h);
        g2.generateTexture('brick_7_hit', w, h);
        g2.destroy();
      }
    }
  }

  _makePowerUps() {
    const cw = 36; const ch = 14; const r = ch / 2;
    const labels = { [POWERUP_TYPE.SLOW]: 'SLO', [POWERUP_TYPE.WIDE]: 'WID', [POWERUP_TYPE.LASER]: 'LAS', [POWERUP_TYPE.MULTI]: 'MLT', [POWERUP_TYPE.LIFE]: 'LIF' };
    for (const type of Object.values(POWERUP_TYPE)) {
      const color = POWERUP_COLOR[type];
      const key = `powerup_${type}`;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1); g.fillRoundedRect(0, 0, cw, ch, r);
      g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(2, 1, cw - 4, 4, 2);
      g.lineStyle(1, 0xffffff, 0.5); g.strokeRoundedRect(0, 0, cw, ch, r);
      g.generateTexture(key, cw, ch); g.destroy();
      const rt = this.add.renderTexture(0, 0, cw, ch).setVisible(false);
      rt.draw(key, 0, 0);
      const txt = this.add.text(cw / 2, ch / 2, labels[type], { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 1 }).setOrigin(0.5, 0.5).setVisible(false);
      rt.draw(txt, txt.x - txt.width / 2, txt.y - txt.height / 2);
      rt.saveTexture(`${key}_labeled`);
      txt.destroy(); rt.destroy();
    }
  }

  _makeParticle() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4);
    g.generateTexture('particle', 4, 4); g.destroy();
  }

  _lighten(hex, amount) {
    const r = Math.min(255, ((hex >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((hex >> 8)  & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, ( hex        & 0xff) + Math.round(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  _darken(hex, amount) {
    const r = Math.max(0, ((hex >> 16) & 0xff) - Math.round(255 * amount));
    const g = Math.max(0, ((hex >> 8)  & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, ( hex        & 0xff) - Math.round(255 * amount));
    return (r << 16) | (g << 8) | b;
  }
}
