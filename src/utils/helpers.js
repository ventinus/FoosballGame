exports.formatTeams = playerIds => {
  let team1, team2
  if (playerIds.length === 2) {
    team1 = `${playerIds[0]}`
    team2 = `${playerIds[1]}`
  } else if (playerIds.length === 4) {
    team1 = playerIds.slice(0, 2).sort().join('::')
    team2 = playerIds.slice(2, 4).sort().join('::')
  }
  return [team1, team2]
}

exports.toCompetitionId = (t1, t2) => [t1, t2].sort().join('V')
