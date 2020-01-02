const { Machine, interpret } = require('xstate')

const api = require('../utils/api')
const helpers = require('../utils/helpers')
const Game = require('../models/game')

const {
  INITIATE_GAME,
  BADGE_SCAN,
  ADD_PLAYER,
  SCORE_POINT,
  APPEND_CHAR,
  BACKSPACE,
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

const mockFindPlayer = isFound => {
  api.findPlayer.mockImplementation((id) => {
    return isFound ? Promise.resolve({ id, alias: 'foo' }) : Promise.resolve({ id })
  })
}

let service
let machine
let state

const setupActive = (onTransition, target = 'active') => {
  service = interpret(init({ players: [1, 2, 3, 4] }))
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
      players: [],
      currentGame: null,
      bestOfLimit: 1,
      cursorPosition: {
        x: 0,
        y: 0,
      },
      selectedPlayerIndices: [],
      newPlayer: {
        id: '',
        alias: '',
      }
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

    it('should initiate registration when unrecognized badge is scanned', done => {
      mockFindPlayer(false)
      service = interpret(init())
        .onTransition(state => {
          if (state.value === 'registration') {
            expect(api.findPlayer).toHaveBeenCalledWith(123)
            expect(state.context.newPlayer.id).toBe(123)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 123 })
    })

    it('should add a player when badge is recognized', done => {
      mockFindPlayer(true)
      service = interpret(init())
        .onTransition(state => {
          if (state.value === 'inactive' && state.context.players.length) {
            expect(state.context.players).toEqual([{ id: 123, alias: 'foo' }])
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 123 })
    })

    it('should add players to the end of the list', done => {
      mockFindPlayer(true)
      service = interpret(init({ players: [{ id: 1234, alias: 'bar' }] }))
        .onTransition(state => {
          if (state.value === 'inactive' && state.context.players.length === 2) {
            expect(state.context.players).toEqual([{ id: 1234, alias: 'bar' }, { id: 567, alias: 'foo' }])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 567 })
    })

    it('should NOT add a player twice', done => {
      mockFindPlayer(true)
      service = interpret(init({ players: [{ id: 321 }] }))
        .onTransition(state => {
          if (state.value === 'inactive' && state.changed === false) {
            expect(state.context.players).toEqual([{ id: 321 }])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 321 })
    })

    it('should not exceed 4 players', done => {
      mockFindPlayer(true)
      service = interpret(init({ players: [{ id: 1, alias: 'foo1' }, { id: 2, alias: 'foo2' }, { id: 3, alias: 'foo3' }, { id: 4, alias: 'foo4' }] }))
        .onTransition(state => {
          if (state.value === 'inactive' && state.context.players[0].id !== 1) {
            expect(state.context.players).toEqual([{ id: 2, alias: 'foo2' }, { id: 3, alias: 'foo3' }, { id: 4, alias: 'foo4' }, { id: 567, alias: 'foo' }])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 567 })
    })

    it('should initiate the game', () => {
      const { initialState } = init({ players: [1, 2, 3, 4] })
      const { value, context } = fsm.transition(initialState, INITIATE_GAME)
      expect(value).toBe('pending')
      expect(context.currentGame).toBe(null)
    })

    it('should switch the player ids on switch sides', () => {
      machine = init({ players: [1, 2] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.players).toEqual([2, 1])

      machine = init({ players: [1, 2, 3, 4] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.players).toEqual([3, 4, 1, 2])
    })

    it('should select a player for switching', () => {
      machine = init({ players: [1, 2] })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)

      state = machine.transition(state, { type: CONFIRM })
      expect(state.context.selectedPlayerIndices).toEqual([1])
    })

    it('should switch a player with one on the other team', () => {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          machine = init({ players: [1, 2, 3, 4], selectedPlayerIndices: [i], cursorPosition: { y: j } })

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
          expect(state.context.players).toEqual(expected)
        }
      }
    })
  })

  describe('registration', () => {
    it('should handle inputting an alias', () => {
      machine = init()

      state = machine.transition('registration', { type: APPEND_CHAR, character: 'a' })
      state = machine.transition(state, { type: APPEND_CHAR, character: 'b' })
      state = machine.transition(state, { type: APPEND_CHAR, character: 'e' })
      expect(state.context.newPlayer.alias).toBe('abe')

      state = machine.transition(state, BACKSPACE)
      state = machine.transition(state, CONFIRM)

      expect(api.createPlayer).toHaveBeenCalledWith({ playerId: '', alias: 'ab' })
      expect(state.context.newPlayer).toEqual({ id: '', alias: '' })
      expect(state.value).toBe('inactive')
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
        expect(helpers.prompt.mock.calls[0][0]).toBe('Would you like to resume your previous unfinished game?')
        done()
      }, 'shouldResume')
    })
  })

  describe('shouldResume', () => {
    it('should resume the game', () => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 1, t2Points: 3 }) })

      state = machine.transition('shouldResume', CONFIRM)
      expect(state.value).toBe('active')
      expect(state.context.currentGame.teamPoints).toEqual([1, 3])
      expect(helpers.prompt.mock.calls[0][0]).toBeUndefined()
    })

    it('should delete the current game and start a new one', () => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 1, t2Points: 3 }) })

      state = machine.transition('shouldResume', DENY)
      expect(api.deleteCurrent).toHaveBeenCalledWith('1V2')
      expect(state.context.currentGame.teamPoints).toEqual([0, 0])
      expect(state.value).toBe('active')
      expect(helpers.prompt.mock.calls[0][0]).toBeUndefined()
    })
  })

  describe('active', () => {
    it('should not change state from an unknown action', () => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2') })

      state = machine.transition('active', ADD_PLAYER)
      expect(state.changed).toBe(false)
      expect(state.context.currentGame.teamPoints).toEqual([0, 0])

      state = machine.transition('active', UNKNOWN)
      expect(state.changed).toBe(false)
    })

    it('should make updates on SCORE_POINT', () => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2') })

      state = machine.transition('active', { type: SCORE_POINT, index: 0 })
      expect(state.context.currentGame.teamPoints).toEqual([1, 0])

      state = machine.transition('active', { type: SCORE_POINT, index: 1 })
      expect(state.context.currentGame.teamPoints).toEqual([1, 1])
    })

    it('should make the game complete when the first team wins', done => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 3 }) })
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
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
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
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
      service = interpret(machine)
        .onTransition(state => {
          if (state.value === 'inactive') {
            expect(state.context.players).toEqual([])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start('active')
      service.send(SCORE_POINT, { index: 1 })
    })
  })
})
