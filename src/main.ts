import Phaser from 'phaser'
import { INTERNAL_WIDTH, INTERNAL_HEIGHT } from './config/palette'
import { Boot } from './game/scenes/Boot'
import { Title } from './game/scenes/Title'
import { Game } from './game/scenes/Game'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: INTERNAL_WIDTH,
  height: INTERNAL_HEIGHT,
  backgroundColor: '#0a1a3f',
  pixelArt: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.NONE,
    width: INTERNAL_WIDTH,
    height: INTERNAL_HEIGHT,
  },
  render: {
    antialias: false,
    pixelArt: true,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [Boot, Title, Game],
}

new Phaser.Game(config)
