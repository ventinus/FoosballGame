const { Machine, interpret } = require('xstate')
let Game = require('../models/game')
const { INITIATE_GAME, ADD_PLAYER, SCORE_POINT } = require('./actionTypes')
const { gameConfig } = require('./config')

const UNKNOWN = 'UNKNOWN'

const fsm = Machine(gameConfig)

const init = (context = {}) => fsm.withContext({ ...fsm.context, ...context })

let service

describe('gameConfig.active', () => {
  let machine
  let state

  it('should not change state from an unknown action', () => {
    machine = init({ playerIds: [1, 2], currentGame: Game('1', '2') })

    state = machine.transition('active', ADD_PLAYER)
    expect(state.changed).toBe(false)
    expect(state.context.currentGame.teamPoints).toEqual([0, 0])

    state = machine.transition('active', UNKNOWN)
    expect(state.changed).toBe(false)
  })

  it('should make updates on SCORE_POINT', () => {
    machine = init({ playerIds: [1, 2], currentGame: Game('1', '2') })

    state = machine.transition('active', { type: SCORE_POINT, index: 0 })
    expect(state.context.currentGame.teamPoints).toEqual([1, 0])

    state = machine.transition('active', { type: SCORE_POINT, index: 1 })
    expect(state.context.currentGame.teamPoints).toEqual([1, 1])
  })

  it('should make the game complete when the first team wins', done => {
    machine = init({ playerIds: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 3 }) })
    service = interpret(machine)
      .onTransition(state => {
        if (state.value === 'complete') {
          expect(state.context.currentGame.teamPoints).toEqual([5, 3])
          expect(state.context.currentGame.props.endedAt).not.toBe(null)
          done()
        }
      })
      .start('active')

    service.send(SCORE_POINT, { index: 0 })
  })

  it('should make the game complete when the second team wins', done => {
    machine = init({ playerIds: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
    service = interpret(machine)
      .onTransition(state => {
        if (state.value === 'complete') {
          expect(state.context.currentGame.teamPoints).toEqual([4, 5])
          expect(state.context.currentGame.props.endedAt).not.toBe(null)
          done()
        }
      })
      .start('active')

    service.send(SCORE_POINT, { index: 1 })
  })

  it('should make the game inactive and reset after game completion', done => {
    machine = init({ playerIds: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
    service = interpret(machine)
      .onTransition(state => {
        if (state.value === 'inactive') {
          expect(state.context.playerIds).toEqual([])
          expect(state.context.currentGame).toBe(null)
          done()
        }
      })
      .start('active')
    service.send(SCORE_POINT, { index: 1 })
  })
})
