const { Machine, interpret, State } = require('xstate')
const shouldResumeGame = require('../utils/deviceHandlers/shouldResumeGame')
let Game = require('../models/game')
const { INITIATE_GAME, ADD_PLAYER, SCORE_POINT } = require('./actionTypes')
const { gameConfig } = require('./config')

jest.mock('../utils/deviceHandlers/shouldResumeGame')
jest.mock('../models/game')

const UNKNOWN = 'UNKNOWN'

const fsm = Machine(gameConfig)

const init = (context = {}) => fsm.withContext({ ...fsm.context, ...context })

const mockResume = shouldResume =>
  shouldResumeGame.mockImplementation(() => Promise.resolve(shouldResume))

Game.mockImplementation((t1, t2) => ({
  teamPoints: [0, 0]
}))

let deleteGame

const mockGame = (findGame, isComplete) => {
  deleteGame = jest.fn()
  Game.find.mockImplementation(() => {
    return !findGame || isComplete ?
      Promise.resolve() :
      Promise.resolve({ teamPoints: [4, 3], deleteGame: deleteGame })
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
    it('should automatically start a new game when no previous game is found', done => {
      mockGame(false)
      setupActive(state => {
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(shouldResumeGame.mock.calls.length).toBe(0)
        done()
      })
    })

    it('should automatically start a new game when no unfinished game is found', done => {
      mockGame(true, true)
      setupActive(state => {
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(shouldResumeGame.mock.calls.length).toBe(0)
        done()
      })
    })

    it('should call game.delete when user does not want to resume and start a new game', done => {
      mockGame(true, false)
      mockResume(false)
      setupActive(state => {
        expect(deleteGame).toHaveBeenCalled()
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(shouldResumeGame.mock.calls.length).toBe(1)
        done()
      })
    })

    it('should resume the game when desired', done => {
      mockGame(true, false)
      mockResume(true)
      setupActive(state => {
        expect(state.context.currentGame.teamPoints).toEqual([4, 3])
        expect(shouldResumeGame.mock.calls.length).toBe(1)
        done()
      })
    })
  })
})
