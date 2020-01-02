const child_process = require('child_process')
const { formatTeams, toCompetitionId, fillOledRow, showCompetition, toOledRows } = require('./helpers')

jest.mock('child_process')
jest.mock('path', () => ({
  resolve: jest.fn(() => '/path')
}))

const toPlayers = ids => ids.map(id => ({ id }))

describe('#formatTeams', () => {
  it('should format 1 player teams', () => {
    expect(formatTeams(toPlayers([123, 345]))).toEqual(['123', '345'])
    expect(formatTeams(toPlayers([345, 123]))).toEqual(['345', '123'])
    expect(formatTeams(toPlayers(['123', '345']))).toEqual(['123', '345'])
    expect(formatTeams(toPlayers(['345', '123']))).toEqual(['345', '123'])
  })

  it('should format 2 player teams', () => {
    expect(formatTeams(toPlayers([123, 234, 345, 456]))).toEqual(['123::234', '345::456'])
    expect(formatTeams(toPlayers([234, 123, 456, 345]))).toEqual(['123::234', '345::456'])
    expect(formatTeams(toPlayers([456, 234, 123, 345]))).toEqual(['234::456', '123::345'])
    expect(formatTeams(toPlayers([456, 234, 345, 123]))).toEqual(['234::456', '123::345'])
    expect(formatTeams(toPlayers(['123', '234', '345', '456']))).toEqual(['123::234', '345::456'])
    expect(formatTeams(toPlayers(['234', '123', '456', '345']))).toEqual(['123::234', '345::456'])
    expect(formatTeams(toPlayers(['456', '234', '123', '345']))).toEqual(['234::456', '123::345'])
    expect(formatTeams(toPlayers(['456', '234', '345', '123']))).toEqual(['234::456', '123::345'])
  })
})

describe('#toCompetitionId', () => {
  it('should form the competition ID', () => {
    expect(toCompetitionId('123', '345')).toBe('123V345')
    expect(toCompetitionId('345', '123')).toBe('123V345')
    expect(toCompetitionId('123::234', '345::456')).toBe('123::234V345::456')
    expect(toCompetitionId('234::456', '123::345')).toBe('123::345V234::456')
  })
})

describe('#fillOledRow', () => {
  it('should separate the two strings with the appropriate amount of spaces', () => {
    expect(fillOledRow('asdf', 'qwer')).toBe('asdf             qwer')
    expect(fillOledRow('as', 'qwer')).toBe('as               qwer')
    expect(fillOledRow('as', 'er')).toBe('as                 er')
    expect(fillOledRow('asdfasdfasdf', 'qwerqwer')).toBe('asdfasdfasdf qwerqwer')
    expect(fillOledRow('asdfasdfasdfasdfasdfasdf', 'qwerqwer')).toBe('asdfasdfasdf qwerqwer')
    expect(fillOledRow('asdf', 'qwerqwerqwerqwerqwerqwer')).toBe('asdf qwerqwerqwerqwer')
  })
})

describe('#showCompetition', () => {
  beforeEach(() => {
    child_process.spawn.mockReset()
  })

  const player = alias => ({ alias })

  it('should display with 1 player', () => {
    showCompetition([player('first')])
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', 'first'])
  })

  it('should display with 2 player', () => {
    showCompetition([player('first'), player('second')])
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'second')])
  })

  it('should display with 3 player', () => {
    showCompetition([player('first'), player('second'), player('third')])
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', 'second'])
  })

  it('should display with 4 player', () => {
    showCompetition([player('first'), player('second'), player('third'), player('fourth')])
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', fillOledRow('second', 'fourth')])
  })
})

describe('#toOledRows', () => {
  it('should split a string into necessary rows', () => {
    expect(toOledRows('Lorem ipsum dolor sit amet, consectetur adipisicing elit. For What'))
      .toEqual(['Lorem ipsum dolor sit', 'amet, consectetur', 'adipisicing elit. For', 'What'])
    expect(toOledRows('Id nisi dicta iste a aliquid quam modi.'))
      .toEqual(['Id nisi dicta iste a', 'aliquid quam modi.'])
    expect(toOledRows('eum error animi optio veniam suscipit unde.'))
      .toEqual(['eum error animi optio', 'veniam suscipit unde.'])
  })

  it('should handle arrays', () => {
    expect(toOledRows(['saf', 'wer', 'adf'])).toEqual(['saf', 'wer', 'adf'])
  })
})
