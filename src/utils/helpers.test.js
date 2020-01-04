const child_process = require('child_process')
const {
  formatTeams,
  toCompetitionId,
  fillOledRow,
  showCompetition,
  toOledRows,
  cursorPositionToCorner,
  minToMs,
} = require('./helpers')

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
    expect(fillOledRow('asdf', 'qwer')).toBe(' asdf           qwer')
    expect(fillOledRow('as', 'qwer')).toBe(' as             qwer')
    expect(fillOledRow('as', 'er')).toBe(' as               er')
    expect(fillOledRow('asdfasdfasdf', 'qwerqwer')).toBe(' asdfasdfas qwerqwer')
    expect(fillOledRow('asdfasdfasdfasdfasdfasdf', 'qwerqwer')).toBe(' asdfasdfas qwerqwer')
    expect(fillOledRow('asdf', 'qwerqwerqwerqwerqwerqwer')).toBe(' asdf qwerqwerqwerqw')
  })
})

describe('#showCompetition', () => {
  beforeEach(() => {
    child_process.spawn.mockReset()
  })

  const player = alias => ({ alias })

  it('should display with 1 player', () => {
    showCompetition([player('first')], {x: 0, y: 0}, true)
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', 'first'])
  })

  it('should display with 2 player', () => {
    showCompetition([player('first'), player('second')], {x: 0, y: 0}, true)
    expect(child_process.spawn).toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'second')])
  })

  it('should display cursor with 3 player', () => {
    showCompetition([player('first'), player('second'), player('third')], {x: 0, y: 0}, true)
    expect(child_process.spawn)
      .toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', 'second', 0])
  })

  it('should display cursor with 4 player', () => {
    showCompetition([player('first'), player('second'), player('third'), player('fourth')], {x: 0, y: 0}, true)
    expect(child_process.spawn)
      .toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', fillOledRow('second', 'fourth'), 0])
  })

  it('should NOT display cursor with 3 player', () => {
    showCompetition([player('first'), player('second'), player('third')], {x: 0, y: 0}, false)
    expect(child_process.spawn)
      .toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', 'second', undefined])
  })

  it('should NOT display cursor with 4 player', () => {
    showCompetition([player('first'), player('second'), player('third'), player('fourth')], {x: 0, y: 0}, false)
    expect(child_process.spawn)
      .toHaveBeenCalledWith('python', ['/path', fillOledRow('first', 'third'), '', '', fillOledRow('second', 'fourth'), undefined])
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

describe('#cursorPositionToCorner', () => {
  it('should output the correct corner number', () => {
    // top left
    expect(cursorPositionToCorner({x: 0, y: 0})).toBe(0)
    // bottom left
    expect(cursorPositionToCorner({x: 0, y: 1})).toBe(1)
    // top right
    expect(cursorPositionToCorner({x: 1, y: 0})).toBe(2)
    // bottom right
    expect(cursorPositionToCorner({x: 1, y: 1})).toBe(3)
  })
})

describe('#minToMs', () => {
  it('should convert minutes to milliseconds', () => {
    expect(minToMs(1)).toBe(60000)
    expect(minToMs(0)).toBe(0)
    expect(minToMs(2)).toBe(120000)
    expect(minToMs(5)).toBe(300000)
    expect(minToMs(10)).toBe(600000)
    expect(minToMs(60)).toBe(3600000)
  })
})
