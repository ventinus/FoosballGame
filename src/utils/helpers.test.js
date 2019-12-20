const { formatTeams, toCompetitionId } = require('./helpers')

describe('#formatTeams', () => {
  it('should format 1 player teams', () => {
    expect(formatTeams([123, 345])).toEqual(['123', '345'])
    expect(formatTeams([345, 123])).toEqual(['345', '123'])
    expect(formatTeams(['123', '345'])).toEqual(['123', '345'])
    expect(formatTeams(['345', '123'])).toEqual(['345', '123'])
  })

  it('should format 2 player teams', () => {
    expect(formatTeams([123, 234, 345, 456])).toEqual(['123::234', '345::456'])
    expect(formatTeams([234, 123, 456, 345])).toEqual(['123::234', '345::456'])
    expect(formatTeams([456, 234, 123, 345])).toEqual(['234::456', '123::345'])
    expect(formatTeams([456, 234, 345, 123])).toEqual(['234::456', '123::345'])
    expect(formatTeams(['123', '234', '345', '456'])).toEqual(['123::234', '345::456'])
    expect(formatTeams(['234', '123', '456', '345'])).toEqual(['123::234', '345::456'])
    expect(formatTeams(['456', '234', '123', '345'])).toEqual(['234::456', '123::345'])
    expect(formatTeams(['456', '234', '345', '123'])).toEqual(['234::456', '123::345'])
  })
})

describe('#toCompetitionId', () => {
  it('should form the competition ID', () => {
    expect(toCompetitionId('123', '345')).toEqual('123V345')
    expect(toCompetitionId('345', '123')).toEqual('123V345')
    expect(toCompetitionId('123::234', '345::456')).toEqual('123::234V345::456')
    expect(toCompetitionId('234::456', '123::345')).toEqual('123::345V234::456')
  })
})
