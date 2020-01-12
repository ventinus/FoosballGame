const { Machine, interpret } = require('xstate')
const readline = require('readline');
const debounce = require('lodash.debounce')

const { Game } = require('./models')
const { gameConfig } = require('./state/config')
const {
  INITIATE_GAME,
  SET_SECONDARY_PI,
  BADGE_SCAN,
  SCORE_POINT,
  APPEND_CHAR,
  BACKSPACE,
  CONFIRM,
  DENY,
  MOVE_CURSOR,
  SWITCH_SIDES,
  GAME_ACTIVITY,
  WARN_PAUSE,
  PAUSE,
} = require('./state/actionTypes')
const { childProcess, minToMs } = require('./utils')

const gameMachine = Machine(gameConfig)
let currentState = gameMachine.initialState.value

const gameService = interpret(gameMachine)
  .onTransition(state => {
    if (state.changed) currentState = state.value
  })
  .start()

const onBadgeScan = data => gameService.send(BADGE_SCAN, { id: data })
const onGameStart = () => gameService.send(INITIATE_GAME)
const onPointScore = index => gameService.send(SCORE_POINT, { index })
const onAppKeypress = keyName => {
  switch (keyName) {
    case 'y':
    case 'return':
      gameService.send(CONFIRM)
      break;
    case 'n':
      gameService.send(DENY)
      break;
    case 'up':
    case 'down':
      // case 'left':
      // case 'right':
      gameService.send(MOVE_CURSOR, { direction: keyName })
      break;
    case 's':
      gameService.send(SWITCH_SIDES)
      break;
  }
}

const onInputKeypress = keyName => {
  if (keyName.length === 1 && /[a-z0-9]/.test(keyName)) {
    gameService.send(APPEND_CHAR, { character: keyName })
  } else if (keyName === 'return') {
    gameService.send(CONFIRM)
  } else if (keyName === 'backspace') {
    gameService.send(BACKSPACE)
  }
}

let gameWarnId = 0
let gamePauseId = 0
const onVibration = () => {
  clearTimeout(gameWarnId)
  clearTimeout(gamePauseId)

  if (currentState === 'pauseWarning') gameService.send(GAME_ACTIVITY)

  gameWarnId = setTimeout(() => {
    gameService.send(WARN_PAUSE)
    gamePauseId = setTimeout(() => gameService.send(PAUSE), 1)
  }, minToMs(2))
}

const badgeScanChild = childProcess('readCard.js', onBadgeScan)
const gameStartChild = childProcess('gameStart.js', onGameStart)
const scorePointChild = childProcess('scorePoint.js', onPointScore)
const vibrationChild = childProcess('vibration.js', debounce(onVibration, 300, { leading: true, trailing: false }))

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const handleKeypress = (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  } else if (currentState === 'registration') {
    onInputKeypress(key.name)
  } else {
    onAppKeypress(key.name)
  }
}
process.stdin.on('keypress', debounce(handleKeypress, 300, { leading: true, trailing: false }));
