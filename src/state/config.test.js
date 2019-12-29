const { Machine, interpret } = require('xstate')

const api = require('../utils/api')
const helpers = require('../utils/helpers')
const Game = require('../models/game')

const {
  INITIATE_GAME,
  ADD_PLAYER,
  SCORE_POINT,
  CONFIRM,
  DENY,
  MOVE_CURSOR,
  SWITCH_SIDES,
} = require('./actionTypes')

const { gameConfig } = require('./config')

jest.mock('../utils/api')
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  sendToScoreboard: jest.fn(),
  prompt: jest.fn(),
}))

const UNKNOWN = 'UNKNOWN'

const fsm = Machine(gameConfig)

const init = (context = {}) => fsm.withContext({ ...fsm.context, ...context })

const mockApi = (isComplete) => {
  api.initializeCompetition.mockImplementation(() => {
    return isComplete ?
      Promise.resolve({ completed: [], current: null }) :
      Promise.resolve({ completed: [], current: { t1Points: 4, t2Points: 3 } })
  })
}

let service
let machine
let state

const setupActive = (onTransition, target = 'active') => {
  service = interpret(init({ playerIds: [1, 2, 3, 4] }))
    .onTransition(state => {
      if (state.matches(target)) {
        onTransition(state)
      }
    })
    .start()

  service.send(INITIATE_GAME)
}

describe('gameConfig', () => {
  beforeEach(() => {
    helpers.sendToScoreboard.mockReset()
    helpers.prompt.mockReset()
    api.deleteCurrent.mockReset()
  })

  it('should initialize with the correct config', () => {
    const { initialState } = fsm
    expect(initialState.value).toEqual('inactive')

    expect(initialState.context).toEqual({
      playerIds: [],
      currentGame: null,
      bestOfLimit: 1,
      cursorPosition: {
        x: 0,
        y: 0,
      },
      selectedPlayerIndices: []
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
      const { value, context } = fsm.transition(initialState, INITIATE_GAME)
      expect(value).toBe('pending')
      expect(context.currentGame).toBe(null)
    })

    it('should switch the player ids on switch sides', () => {
      machine = init({ playerIds: [1, 2] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.playerIds).toEqual([2, 1])

      machine = init({ playerIds: [1, 2, 3, 4] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.playerIds).toEqual([3, 4, 1, 2])
    })

    it('should select a player for switching', () => {
      machine = init({ playerIds: [1, 2] })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)

      state = machine.transition(state, { type: CONFIRM })
      expect(state.context.selectedPlayerIndices).toEqual([1])
    })

    it('should switch a player with one on the other team', () => {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          machine = init({ playerIds: [1, 2, 3, 4], selectedPlayerIndices: [i], cursorPosition: { y: j } })

          state = machine.transition(machine.initialState, { type: CONFIRM })
          expect(state.context.selectedPlayerIndices).toEqual([])
          let expected
          if (i === 0) {
            if (j === 0) {
              expected = [3, 2, 1, 4]
            } else {
              expected = [4, 2, 3, 1]
            }
          } else {
            if (j === 0) {
              expected = [1, 3, 2, 4]
            } else {
              expected = [1, 4, 3, 2]
            }
          }
          expect(state.context.playerIds).toEqual(expected)
        }
      }
    })
  })

  describe('pending', () => {
    it('should automatically start a new game when no unfinished game is found', done => {
      mockApi(true)
      setupActive(state => {
        expect(state.value).toBe('active')
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(helpers.sendToScoreboard.mock.calls[0][0].teamPoints).toEqual([0, 0])
        done()
      })
    })

    it('should move to shouldResume state when an unfinished game is found', done => {
      mockApi(false)
      setupActive(state => {
        expect(state.value).toBe('shouldResume')
        expect(state.context.currentGame.teamPoints).toEqual([4, 3])
        expect(helpers.sendToScoreboard.mock.calls[0][0].teamPoints).toEqual([4, 3])
        expect(helpers.prompt.mock.calls[0][0].length).toBe(4)
        done()
      }, 'shouldResume')
    })
  })

  describe('shouldResume', () => {
    it('should resume the game', () => {
      machine = init({ playerIds: [1, 2], currentGame: Game('1', '2', { t1Points: 1, t2Points: 3 }) })

      state = machine.transition('shouldResume', CONFIRM)
      expect(state.value).toBe('active')
      expect(state.context.currentGame.teamPoints).toEqual([1, 3])
      expect(helpers.prompt.mock.calls[0][0]).toBeUndefined()
    })

    it('should delete the current game and start a new one', () => {
      machine = init({ playerIds: [1, 2], currentGame: Game('1', '2', { t1Points: 1, t2Points: 3 }) })

      state = machine.transition('shouldResume', DENY)
      expect(api.deleteCurrent).toHaveBeenCalledWith('1V2')
      expect(state.context.currentGame.teamPoints).toEqual([0, 0])
      expect(state.value).toBe('active')
      expect(helpers.prompt.mock.calls[0][0]).toBeUndefined()
    })
  })

  describe('active', () => {
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
