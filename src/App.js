const {
  GetPlayer,
  ResumeGame,
  StartGame,
  ScoreGoal,
  EndGame,
} = require('./utils')

const App = async () => {

  // listen for player badges to be scanned
  const p1 = await GetPlayer()
  const p2 = await GetPlayer()


  // when the StartGame sensor is triggered
  const team1 = [p1]
  const team2 = [p2]

  const incompleteGame = await StartGame(team1, team2)

  if (incompleteGame) {
    console.log('Send message to resume or delete unfinished game.')
    // await yes/no input
    const resume = true
    if (resume) {

    }
  }

  // listen for goals to be scored

  ScoreGoal(team1)
  EndGame()
}

module.exports = App
