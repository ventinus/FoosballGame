const { Machine, interpret } = require('xstate')

const { Game, Player } = require('./models')
const { gameConfig } = require('./state/config')
const { INITIATE_GAME, ADD_PLAYER, SCORE_POINT } = require('./state/actionTypes')
const { childProcess } = require('./utils')

const gameMachine = Machine(gameConfig)
const gameService = interpret(gameMachine).start()

const onBadgeScan = data => gameService.send(ADD_PLAYER, { id: data })
const onGameStart = () => gameService.send(INITIATE_GAME)
const onPointScore = index => gameService.send(SCORE_POINT, { index })

const badgeScanChild = childProcess('readCard.js', onBadgeScan)
const gameStartChild = childProcess('gameStart.js', onGameStart)
const scorePointChild = childProcess('scorePoint.js', onPointScore)
