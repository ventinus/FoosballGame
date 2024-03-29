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
  WARN_PAUSE,
  GAME_ACTIVITY,
  PAUSE,
} = require('./actionTypes')

const { gameConfig } = require('./config')

jest.spyOn(Date, 'now')

jest.mock('../utils/api')
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  sendToScoreboard: jest.fn(),
  prompt: jest.fn(),
  beep: jest.fn(),
  showCompetition: jest.fn(),
}))

const UNKNOWN = 'UNKNOWN'

const fsm = Machine(gameConfig)

const init = (context = {}) => fsm.withContext({ ...fsm.context, ...context })

const mockApi = (isComplete) => {
  api.initializeCompetition.mockImplementation(() => {
    return isComplete
      ? Promise.resolve({ completed: [], current: null })
      : Promise.resolve({ completed: [], current: { t1Points: 4, t2Points: 3 } })
  })
}

const mockFindPlayer = (isFound) => {
  api.findPlayer.mockImplementation((id) => {
    return isFound ? Promise.resolve({ id, alias: 'foo' }) : Promise.resolve({ id })
  })
}

let service
let machine
let state

const setupActive = (onTransition, target = 'active') => {
  service = interpret(init({ players: [1, 2, 3, 4] }))
    .onTransition((state) => {
      if (state.matches(target)) {
        onTransition(state)
      }
    })
    .start()

  service.send(INITIATE_GAME)
}

describe('gameConfig', () => {
  beforeEach(() => {
    helpers.sendToScoreboard.mockClear()
    helpers.prompt.mockClear()
    helpers.beep.mockClear()
    helpers.showCompetition.mockClear()
    api.deleteCurrent.mockClear()
    api.updateCurrent.mockClear()
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
        id: 0,
        alias: '',
      },
    })
  })

  describe('inactve', () => {
    it('should not change state from an unknown action', () => {
      const nextState = fsm.transition(fsm.initialState, UNKNOWN)
      expect(nextState.changed).toBe(false)
    })

    it('should NOT initiate the game with no players', () => {
      const nextState = fsm.transition(fsm.initialState, INITIATE_GAME)
      expect(nextState.changed).toBe(false)
    })

    it('should initiate registration when unrecognized badge is scanned', (done) => {
      mockFindPlayer(false)
      service = interpret(init())
        .onTransition((state) => {
          if (state.value === 'registration') {
            expect(api.findPlayer).toHaveBeenCalledWith(123)
            expect(state.context.newPlayer.id).toBe(123)
            expect(helpers.prompt.mock.calls[0][0]).toBe('Please wait while I look you up...')
            expect(helpers.prompt.mock.calls[1][0]).toEqual(['Enter a name (<10):', '', ''])
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 123 })
    })

    it('should add a player when badge is recognized', (done) => {
      mockFindPlayer(true)
      service = interpret(init())
        .onTransition((state) => {
          if (state.value === 'inactive' && state.context.players.length) {
            expect(state.context.players).toEqual([{ id: 123, alias: 'foo' }])
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 123 })
    })

    it('should add players to the end of the list', (done) => {
      mockFindPlayer(true)
      service = interpret(init({ players: [{ id: 1234, alias: 'bar' }] }))
        .onTransition((state) => {
          if (state.value === 'inactive' && state.context.players.length === 2) {
            expect(state.context.players).toEqual([
              { id: 1234, alias: 'bar' },
              { id: 567, alias: 'foo' },
            ])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 567 })
    })

    it('should NOT add a player twice', (done) => {
      mockFindPlayer(true)
      let render = 0
      service = interpret(init({ players: [{ id: 321 }] }))
        .onTransition((state) => {
          render++
          if (state.value === 'inactive' && state.changed === false && render > 1) {
            expect(state.context.players).toEqual([{ id: 321 }])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 321 })
    })

    it('should not exceed 4 players', (done) => {
      mockFindPlayer(true)
      service = interpret(
        init({
          players: [
            { id: 1, alias: 'foo1' },
            { id: 2, alias: 'foo2' },
            { id: 3, alias: 'foo3' },
            { id: 4, alias: 'foo4' },
          ],
        })
      )
        .onTransition((state) => {
          if (state.value === 'inactive' && state.context.players[0].id !== 1) {
            expect(state.context.players).toEqual([
              { id: 2, alias: 'foo2' },
              { id: 3, alias: 'foo3' },
              { id: 4, alias: 'foo4' },
              { id: 567, alias: 'foo' },
            ])
            expect(state.context.currentGame).toBe(null)
            done()
          }
        })
        .start()
      service.send({ type: BADGE_SCAN, id: 567 })
    })

    it('should initiate the game', () => {
      const { initialState } = init({ players: [1, 2, 3, 4] })
      expect(initialState.value).toBe('inactive')
      const { value, changed } = fsm.transition(initialState, INITIATE_GAME)
      expect(changed).toBe(true)
      expect(value).toBe('pending')
    })

    it('should switch the player ids on SWITCH_SIDES', () => {
      machine = init({ players: [1, 2] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.players).toEqual([2, 1])

      machine = init({ players: [1, 2, 3, 4] })

      state = machine.transition('inactive', SWITCH_SIDES)
      expect(state.context.players).toEqual([3, 4, 1, 2])
    })

    it('should NOT move the cursor with less than 3 players', () => {
      ;[[100], [100, 200]].forEach((ids) => {
        machine = init({ players: ids })

        state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
        expect(state.context.cursorPosition.y).toBe(0)
      })
    })

    it('should move the cursor on the left with 3 players', () => {
      machine = init({ players: [100, 200, 300] })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)
    })

    it('should NOT move the cursor on the right with 3 players', () => {
      machine = init({
        players: [100, 200, 300],
        selectedPlayerIndices: [1],
        cursorPosition: { x: 1, y: 0 },
      })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(0)
    })

    it('should move the cursor on the left with 4 players', () => {
      machine = init({ players: [100, 200, 300, 400] })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)
    })

    it('should move the cursor on the right with 4 players', () => {
      machine = init({ players: [100, 200, 300, 400], cursorPosition: { x: 1, y: 0 } })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)
    })

    it('should select a player for switching', () => {
      machine = init({ players: [100, 200, 300, 400] })

      state = machine.transition('inactive', { type: MOVE_CURSOR, direction: 'up' })
      expect(state.context.cursorPosition.y).toBe(1)

      state = machine.transition(state, { type: CONFIRM })
      expect(state.context.selectedPlayerIndices).toEqual([1])
    })

    it('should NOT select a player for switching', () => {
      machine = init({ players: [100] })

      state = machine.transition(state, { type: CONFIRM })
      expect(state.context.selectedPlayerIndices.length).toBe(0)
    })

    it('should switch a player with one on the other team', () => {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          machine = init({
            players: [1, 2, 3, 4],
            selectedPlayerIndices: [i],
            cursorPosition: { y: j },
          })

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
      machine = init({ newPlayer: { id: 888, alias: '' } })

      state = machine.transition('registration', { type: APPEND_CHAR, character: 'a' })
      state = machine.transition(state, { type: APPEND_CHAR, character: 'b' })
      state = machine.transition(state, { type: APPEND_CHAR, character: 'e' })
      expect(helpers.prompt.mock.calls[0][0][0]).toBe('Enter a name (<10):')
      expect(state.context.newPlayer.alias).toBe('abe')

      state = machine.transition(state, BACKSPACE)
      expect(helpers.prompt).toHaveBeenCalledTimes(4)
      expect(helpers.prompt.mock.calls.map((call) => call[0][2])).toEqual(['a', 'ab', 'abe', 'ab'])

      state = machine.transition(state, CONFIRM)
      expect(api.createPlayer).toHaveBeenCalledWith({ playerId: 888, alias: 'ab' })
      expect(state.context.newPlayer).toEqual({ id: 0, alias: '' })
      expect(state.context.players).toEqual([{ id: 888, alias: 'ab' }])
      expect(state.value).toBe('inactive')
    })
  })

  describe('pending', () => {
    it('should automatically start a new game when no unfinished game is found', (done) => {
      mockApi(true)
      setupActive((state) => {
        expect(state.value).toBe('active')
        expect(state.context.currentGame.teamPoints).toEqual([0, 0])
        expect(helpers.sendToScoreboard.mock.calls[0][0].teamPoints).toEqual([0, 0])
        expect(helpers.showCompetition.mock.calls[1]).toEqual([[1, 2, 3, 4], { x: 0, y: 0 }, false])
        done()
      })
    })

    it('should move to shouldResume state when an unfinished game is found', (done) => {
      mockApi(false)
      setupActive((state) => {
        expect(state.value).toBe('shouldResume')
        expect(state.context.currentGame.teamPoints).toEqual([4, 3])
        expect(helpers.sendToScoreboard.mock.calls[0][0].teamPoints).toEqual([4, 3])
        expect(helpers.prompt.mock.calls[0][0]).toBe(
          'Would you like to resume your previous unfinished game?'
        )
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
      expect(helpers.showCompetition).toHaveBeenCalledTimes(1)
      expect(helpers.showCompetition).toHaveBeenCalledWith([1, 2], { x: 0, y: 0 }, false)
    })

    it('should delete the current game and start a new one', () => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 1, t2Points: 3 }) })

      state = machine.transition('shouldResume', DENY)
      expect(api.deleteCurrent).toHaveBeenCalledWith('1V2')
      expect(state.context.currentGame.teamPoints).toEqual([0, 0])
      expect(state.value).toBe('active')
      expect(helpers.prompt).toHaveBeenCalledTimes(1)
      expect(helpers.showCompetition).toHaveBeenCalledTimes(1)
      expect(helpers.showCompetition).toHaveBeenCalledWith([1, 2], { x: 0, y: 0 }, false)
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

      expect(helpers.sendToScoreboard).toHaveBeenCalledTimes(2)
      expect(api.updateCurrent).toHaveBeenCalledTimes(2)
    })

    it('should make the game complete when the first team wins', (done) => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 3 }) })
      service = interpret(machine)
        .onTransition((state) => {
          if (state.value === 'complete') {
            expect(state.context.currentGame.teamPoints).toEqual([5, 3])
            expect(state.context.currentGame.props.endedAt).not.toBe(null)
            done()
          }
        })
        .start('active')

      service.send(SCORE_POINT, { index: 0 })
    })

    it('should make the game complete when the second team wins', (done) => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
      service = interpret(machine)
        .onTransition((state) => {
          if (state.value === 'complete') {
            expect(state.context.currentGame.teamPoints).toEqual([4, 5])
            expect(state.context.currentGame.props.endedAt).not.toBe(null)
            done()
          }
        })
        .start('active')

      service.send(SCORE_POINT, { index: 1 })
    })

    it('should make the game inactive and reset after game completion', (done) => {
      machine = init({ players: [1, 2], currentGame: Game('1', '2', { t1Points: 4, t2Points: 4 }) })
      service = interpret(machine)
        .onTransition((state) => {
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

  describe('pauseWarning', () => {
    const gameProps = (extra = {}) => ({
      players: [1, 2],
      currentGame: Game('1', '2', { ...extra, t1Points: 4, t2Points: 4 }),
    })

    it('should turn on the warning on entry', () => {
      machine = init(gameProps())

      state = machine.transition('active', WARN_PAUSE)
      expect(state.value).toBe('pauseWarning')
      expect(helpers.beep).toHaveBeenCalledWith(true)
      expect(helpers.prompt).toHaveBeenCalledWith('Are you still playing this game?')
    })

    it('should turn off the warning on exit and go back to active on confirm', () => {
      machine = init(gameProps())

      state = machine.transition('pauseWarning', CONFIRM)
      expect(state.value).toBe('active')
      expect(helpers.beep).toHaveBeenCalledWith(false)
      expect(helpers.prompt).toHaveBeenCalledWith('')
      expect(helpers.showCompetition).toHaveBeenCalled()
    })

    it('should go back to active when activity detected', () => {
      machine = init(gameProps())

      state = machine.transition('pauseWarning', GAME_ACTIVITY)
      expect(state.value).toBe('active')
      expect(helpers.beep).toHaveBeenCalledWith(false)
      expect(helpers.prompt).toHaveBeenCalledWith('')
      expect(helpers.showCompetition).toHaveBeenCalled()
    })

    it('should pause and reset the game when denied', () => {
      Date.now.mockImplementation(() => 100)
      machine = init(gameProps())

      state = machine.transition('pauseWarning', DENY)
      expect(state.value).toBe('inactive')
      expect(api.updateCurrent.mock.calls[0][1].pausedAt).toBe(100)
      expect(helpers.beep).toHaveBeenCalledWith(false)
      expect(state.context.currentGame).toBe(null)
      expect(state.context.players).toEqual([])
    })

    it('should pause and reset the game when paused', () => {
      Date.now.mockImplementation(() => 100)
      machine = init(gameProps())

      state = machine.transition('pauseWarning', PAUSE)
      expect(state.value).toBe('inactive')
      expect(api.updateCurrent.mock.calls[0][1].pausedAt).toBe(100)
      expect(helpers.beep).toHaveBeenCalledWith(false)
      expect(state.context.currentGame).toBe(null)
      expect(state.context.players).toEqual([])
    })
  })
})
