const { assign } = require('xstate')
const { Game } = require('../models')
const { formatTeams } = require('../utils')
const shouldResumeGame = require('../utils/deviceHandlers/shouldResumeGame')

exports.getShouldResume = async ({ playerIds }) => {
  // find a previous game, if there is a game, prompt whether or not to resume.
  // if no previous game or no desire to resume, just resolve with nothing
  // if user wants to resume, resolve with the previous score in teamPoints
  const [team1, team2] = formatTeams(playerIds)

  const data = await Game.initializeCompetition(team1, team2)

  if (!data.current) {
    return Promise.resolve(Game(team1, team2))
  }

  const game = Game(team1, team2, data.current)

  // TODO: prompt user for resuming or not
  const wantsToResume = await shouldResumeGame()

  if (wantsToResume) {
    return Promise.resolve(game)
  } else {
    return Promise.reject(game)
  }
}

exports.completeGame = ({ currentGame }) => {
  currentGame.endGame()
  currentGame.finalizeGame()
  return Promise.resolve()
}
