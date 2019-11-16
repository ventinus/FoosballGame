exports.generateGameId = (team1Ids, team2Ids) => {
  const delim = '::'
  return `${team1Ids.join(delim)}V${team2Ids.join(delim)}`
}
