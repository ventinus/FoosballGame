const { Game } = require('.')
const api = require('../utils/api')

jest.mock('../utils/api')

let game

const init = (props = {}) => Game('team1', 'team2', props)

jest.spyOn(Date, 'now')

describe('Game', () => {
  beforeEach(() => {
    Date.now.mockImplementation(() => 500)
    for (let key in api) {
      api[key].mockClear()
    }
  })

  it('should initialize with default props', () => {
    expect(init().props).toEqual({
      t1: 'team1',
      t2: 'team2',
      t1Points: 0,
      t2Points: 0,
      startedAt: 500,
      endedAt: null,
      pausedDurations: [],
      gameDuration: null,
    })
  })

  it('should initialize with predefined props', () => {
    const newProps = {
      t1Points: 2,
      t2Points: 4,
      startedAt: 300,
      endedAt: 600,
      pausedDurations: [100],
      gameDuration: 1000,
    }
    expect(init(newProps).props).toEqual({
      t1: 'team1',
      t2: 'team2',
      ...newProps,
    })
  })

  it('should accrue pausedDurations', () => {
    game = init({ pausedAt: 100 })
    expect(game.props.pausedDurations).toEqual([400])

    game = init({ pausedAt: 100, pausedDurations: [300] })
    expect(game.props.pausedDurations).toEqual([300, 400])
  })

  it('should format the competitionId', () => {
    game = init()
    expect(game.competitionId).toBe('team1Vteam2')

    game = Game('t1::t2', 't3::t4')
    expect(game.competitionId).toBe('t1::t2Vt3::t4')
  })

  it('should scorePoint', () => {
    game = init()
    game.scorePoint(0)
    expect(game.teamPoints).toEqual([1, 0])
    game.scorePoint(1)
    expect(game.teamPoints).toEqual([1, 1])
    game.scorePoint(1)
    expect(game.teamPoints).toEqual([1, 2])
    game.scorePoint(0)
    expect(game.teamPoints).toEqual([2, 2])
  })

  it('should updateGame', () => {
    game = init()
    game.scorePoint(0)
    game.scorePoint(0)
    game.scorePoint(0)
    game.updateGame()
    expect(api.updateCurrent).toHaveBeenCalledWith('team1Vteam2', {
      t1: 'team1',
      t2: 'team2',
      t1Points: 3,
      t2Points: 0,
      startedAt: 500,
      endedAt: null,
      gameDuration: null,
      pausedDurations: [],
    })
  })

  it('should deleteGame', () => {
    game = init()
    game.deleteGame()
    expect(api.deleteCurrent).toHaveBeenCalledWith('team1Vteam2')
  })

  it('should endGame', () => {
    game = init()
    Date.now.mockImplementation(() => 600)
    game.endGame()
    expect(game.props.endedAt).toBe(600)
  })

  it('should pauseGame', () => {
    game = init()
    Date.now.mockImplementation(() => 700)
    game.pauseGame()
    expect(game.props.pausedAt).toBe(700)
  })

  it('should finalizeGame', () => {
    game = init()
    game.finalizeGame()
    expect(api.finalize).not.toHaveBeenCalled()

    game = init({
      t1Points: 2,
      t2Points: 4,
      startedAt: 300,
      endedAt: 600,
      pausedDurations: [100],
      gameDuration: 1000,
    })
    game.endGame()
    game.finalizeGame()
    expect(api.finalize).toHaveBeenCalledWith('team1Vteam2', {
      t1: 'team1',
      t2: 'team2',
      t1Points: 2,
      t2Points: 4,
      startedAt: 300,
      endedAt: 500,
      gameDuration: 100,
      pausedDurations: [100],
    })
  })
})
