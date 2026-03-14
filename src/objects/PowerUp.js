import Phaser from 'phaser';
import {
  POWERUP_TYPE, POWERUP_DURATION,
  BALL_SPEED_INITIAL, PADDLE_W, PADDLE_H, PADDLE_Y,
  SPEED_LEVEL_DEFAULT,
} from '../constants.js';

export class PowerUpManager {
  constructor(scene) {
    this._scene  = scene;
    this._timers = { slow: null, wide: null, laser: null };
    this.laserActive = false;
  }

  apply(type) {
    switch (type) {
      case POWERUP_TYPE.SLOW:  this._applySlow();  return true;
      case POWERUP_TYPE.WIDE:  this._applyWide();  return true;
      case POWERUP_TYPE.LASER: this._applyLaser(); return true;
      case POWERUP_TYPE.MULTI: this._applyMulti(); return true;
      default: return false;
    }
  }

  cancelAll() {
    for (const key of Object.keys(this._timers)) {
      if (this._timers[key]) { this._timers[key].remove(false); this._timers[key] = null; }
    }
    this._revertWide();
    this._revertLaser();
  }

  _applySlow() {
    if (this._timers.slow) this._timers.slow.remove(false);
    const s = this._scene;
    const baseSpeed = BALL_SPEED_INITIAL * (s._speedLevel / SPEED_LEVEL_DEFAULT);
    const target = baseSpeed * 0.6;
    s._balls.forEach((b) => { b._speed = target; });
    s._normalizeBallSpeeds();
    this._timers.slow = s.time.delayedCall(POWERUP_DURATION[POWERUP_TYPE.SLOW], () => {
      const revert = BALL_SPEED_INITIAL * (s._speedLevel / SPEED_LEVEL_DEFAULT);
      s._balls.forEach((b) => { b._speed = revert; });
      s._normalizeBallSpeeds();
      this._timers.slow = null;
    });
  }

  _applyWide() {
    if (this._timers.wide) this._timers.wide.remove(false);
    const s = this._scene;
    const newW = PADDLE_W * 1.8;
    s._paddle.setDisplaySize(newW, PADDLE_H);
    s._paddle.body.setSize(newW, PADDLE_H);
    s._paddle.body.reset(s._paddle.x, PADDLE_Y);
    this._timers.wide = s.time.delayedCall(POWERUP_DURATION[POWERUP_TYPE.WIDE], () => { this._revertWide(); this._timers.wide = null; });
  }

  _revertWide() {
    const s = this._scene;
    if (!s._paddle?.body) return;
    s._paddle.setDisplaySize(PADDLE_W, PADDLE_H);
    s._paddle.body.setSize(PADDLE_W, PADDLE_H);
    s._paddle.body.reset(s._paddle.x, PADDLE_Y);
  }

  _applyLaser() {
    if (this._timers.laser) this._timers.laser.remove(false);
    const s = this._scene;
    this.laserActive = true;
    s._paddle.setTint(0xff6666);
    this._timers.laser = s.time.delayedCall(POWERUP_DURATION[POWERUP_TYPE.LASER], () => { this._revertLaser(); this._timers.laser = null; });
  }

  _revertLaser() {
    this.laserActive = false;
    if (this._scene._paddle?.active) this._scene._paddle.clearTint();
  }

  _applyMulti() {
    const s = this._scene;
    const src = s._balls.find((b) => !b._onPaddle);
    if (!src) return;
    for (let i = 0; i < 2; i++) {
      const nb = s._createBall(src.x, src.y);
      nb._speed = src._speed;
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(-160, -20));
      nb.body.setVelocity(Math.cos(angle) * nb._speed, Math.sin(angle) * nb._speed);
      if (nb._trail) nb._trail.start();
    }
  }
}
