const { Machine, interpret } = require('xstate')
const readline = require('readline');

const { Game } = require('./models')
const { gameConfig } = require('./state/config')
const {
  INITIATE_GAME,
  ADD_PLAYER,
  SCORE_POINT,
  CONFIRM,
  DENY,
  MOVE_CURSOR,
  SWITCH_SIDES,
} = require('./state/actionTypes')
const { childProcess } = require('./utils')

const gameMachine = Machine(gameConfig)
const gameService = interpret(gameMachine).start()

const onBadgeScan = data => gameService.send(ADD_PLAYER, { id: data })
const onGameStart = () => gameService.send(INITIATE_GAME)
const onPointScore = index => gameService.send(SCORE_POINT, { index })
const onKeypress = keyName => {
  switch (keyName) {
    case 'y':
    case 'return':
      gameService.send(CONFIRM)
      return
    case 'n':
      gameService.send(DENY)
      return
    case 'up':
    case 'down':
    case 'left':
    case 'right':
      gameService.send(MOVE_CURSOR, { direction: keyName })
      return
    case 's':
      gameService.send(SWITCH_SIDES)
      return
    default:
      return
  }
}

const badgeScanChild = childProcess('readCard.js', onBadgeScan)
const gameStartChild = childProcess('gameStart.js', onGameStart)
const scorePointChild = childProcess('scorePoint.js', onPointScore)

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  } else {
    onKeypress(key.name)
  }
});
