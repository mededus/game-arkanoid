import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import MenuScene from './scenes/MenuScene.js'
import GameScene from './scenes/GameScene.js'
import UIScene   from './scenes/UIScene.js'

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
}

new Phaser.Game(config)
