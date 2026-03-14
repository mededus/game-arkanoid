import Phaser from 'phaser';
import { SCENE, GAME_WIDTH, GAME_HEIGHT, SPEED_LEVEL_DEFAULT } from '../constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.UI });
  }

  create() {
    const style = { fontSize: '14px', fontFamily: 'monospace' };
    this._scoreTxt = this.add.text(8, 6, 'SCORE 0', { ...style, color: '#ffffff' });
    this._levelTxt = this.add.text(GAME_WIDTH / 2, 6, 'LEVEL 1', { ...style, color: '#ffdd00' }).setOrigin(0.5, 0);
    this._livesTxt = this.add.text(GAME_WIDTH - 8, 6, '♥♥♥', { ...style, color: '#ff6666' }).setOrigin(1, 0);
    this._multTxt = this.add.text(8, 32, '×1.0', { fontSize: '13px', fontFamily: 'monospace', color: '#ffdd00' });
    this._speedTxt = this.add.text(GAME_WIDTH / 2, 32, 'SPEED  10', { fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5, 0);
    const btnStyle = { fontSize: '16px', fontFamily: 'monospace', color: '#cccccc' };
    const btnMinus = this.add.text(GAME_WIDTH - 52, 29, '[−]', btnStyle).setInteractive({ useHandCursor: true });
    btnMinus.on('pointerover', () => btnMinus.setColor('#ffdd00'));
    btnMinus.on('pointerout', () => btnMinus.setColor('#cccccc'));
    btnMinus.on('pointerdown', () => this.scene.get(SCENE.GAME)._changeSpeed(-1));
    const btnPlus = this.add.text(GAME_WIDTH - 26, 29, '[+]', btnStyle).setInteractive({ useHandCursor: true });
    btnPlus.on('pointerover', () => btnPlus.setColor('#ffdd00'));
    btnPlus.on('pointerout', () => btnPlus.setColor('#cccccc'));
    btnPlus.on('pointerdown', () => this.scene.get(SCENE.GAME)._changeSpeed(1));
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 11, '+ / −  speed  •  mouse  paddle  •  click  launch', { fontSize: '10px', fontFamily: 'monospace', color: '#445566', alpha: 0.7 }).setOrigin(0.5, 0.5);
    const game = this.scene.get(SCENE.GAME);
    game.events.on('score', (v) => this._scoreTxt.setText(`SCORE ${v}`), this);
    game.events.on('lives', (v) => this._livesTxt.setText('♥'.repeat(Math.max(0, v))), this);
    game.events.on('level', (v) => this._levelTxt.setText(`LEVEL ${v}`), this);
    game.events.on('speedLevel', (v) => this._onSpeedLevel(v), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off('score', null, this);
      game.events.off('lives', null, this);
      game.events.off('level', null, this);
      game.events.off('speedLevel', null, this);
    });
  }

  _onSpeedLevel(v) {
    const mult = v / SPEED_LEVEL_DEFAULT;
    this._multTxt.setText(`×${mult.toFixed(1)}`);
    this._speedTxt.setText(`SPEED  ${v}`);
    if (v > SPEED_LEVEL_DEFAULT) this._multTxt.setColor('#44ff88');
    else if (v < SPEED_LEVEL_DEFAULT) this._multTxt.setColor('#ff8844');
    else this._multTxt.setColor('#ffdd00');
  }
}
