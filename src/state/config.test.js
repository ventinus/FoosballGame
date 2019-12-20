const { Machine, interpret } = require('xstate')
const shouldResumeGame = require('../utils/deviceHandlers/shouldResumeGame')
const api = require('../utils/api')
const Game = require('../models/game')
const { INITIATE_GAME, ADD_PLAYER, SCORE_POINT } = require('./actionTypes')
const { gameConfig } = require('./config')

jest.mock('../utils/deviceHandlers/shouldResumeGame')
jest.mock('../utils/api')

const UNKNOWN = 'UNKNOWN'

const fsm = Machine(gameConfig)

const init = (context = {}) => fsm.withContext({ ...fsm.context, ...context })

const mockResume = shouldResume =>
  shouldResumeGame.mockImplementation(() => Promise.resolve(shouldResume))

const mockApi = (isComplete) => {
  api.initializeCompetition.mockImplementation(() => {
    return isComplete ?
      Promise.resolve({ current: null }) :
      Promise.resolve({ completed: [], current: { t1Points: 4, t2Points: 3 } })
  })
}

let service

const setupActive = (onTransition) => {
  service = interpret(init({ playerIds: [1, 2, 3, 4] }))
    .onTransition(state => {
      if (state.matches('active')) {
        onTransition(state)
      }
    })
    .start()

  service.send(INITIATE_GAME)
}

describe('gameConfig', () => {
  beforeEach(() => {
    shouldResumeGame.mockReset()
  })

  it('should initialize with the correct config', () => {
    const { initialState } = fsm
    expect(initialState.value).toEqual('inactive')

    expect(initialState.context).toEqual({
      playerIds: [],
      currentGame: null,
      bestOfLimit: 1
    })
  })

  describe('inactve', () => {
    it('should not change state from an unknown action', () => {
      const nextState = fsm.transition(fsm.initialState, UNKNOWN)
      expect(nextState.changed).toBe(false)
    })

    it('should NOT initiate the game', () => {
      const nextState = fsm.transition(fsm.initialState, INITIATE_GAME)
      expect(nextState.changed).toBe(false)
    })

    it('should add a player', () => {
      const { changed, context } = fsm.transition(fsm.initialState, { type: ADD_PLAYER, id: 123 })
      expect(changed).toBe(true)
      expect(context.playerIds).toEqual([123])
      expect(context.currentGame).toBe(null)
    })

    it('should add players to the beginning of the list', () => {
      const { initialState } = init({ playerIds: [1234] })
      const { context } = fsm.transition(initialState, { type: ADD_PLAYER, id: 567 })
      expect(context.playerIds).toEqual([567, 1234])
      expect(context.currentGame).toBe(null)
    })

    it('should not exceed 4 players', () => {
      const { initialState } = init({ playerIds: [1, 2, 3, 4] })
      const { context } = fsm.transition(initialState, { type: ADD_PLAYER, id: 567 })
      expect(context.playerIds).toEqual([567, 1, 2, 3])
      expect(context.currentGame).toBe(null)
    })

    it('should initiate the game', () => {
      const { initialState } = init({ playerIds: [1, 2, 3, 4] })
      const { value, context } = fsm.transition(initialState, { type: INITIATE_GAME })
      expect(value).toBe('pending')
      expect(context.currentGame).toBe(null)
    })
  })

  describe('pending', () => {
    it('should automatically start a new game when no unfinished game is found', done => {
      mockApi(true)
      setupActive(state => {
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(shouldResumeGame.mock.calls.length).toBe(0)
        done()
      })
    })

    // TODO: needs to monitor the api #deleteCurrent function to see if it was called
    it('should call game.delete when user does not want to resume and start a new game', done => {
      mockApi(false)
      mockResume(false)
      setupActive(state => {
        expect(api.deleteCurrent).toHaveBeenCalled()
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(shouldResumeGame.mock.calls.length).toBe(1)
        done()
      })
    })

    it('should resume the game when desired', done => {
      mockApi(false)
      mockResume(true)
      setupActive(state => {
        expect(state.context.currentGame.teamPoints).toEqual([4, 3])
        expect(shouldResumeGame.mock.calls.length).toBe(1)
        done()
      })
    })
  })

  describe('active', () => {
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
})
