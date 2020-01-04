const api = require('../utils/api')
const { toCompetitionId } = require('../utils')

const Game = (t1, t2, initialProps = {}) => {
  if (!t1 && !t2) {
    console.log('Two teams must be present to create a game, ending')
    return
  }

  const props = {
    t1: t1,
    t2: t2,
    t1Points: initialProps.t1Points || 0,
    t2Points: initialProps.t2Points || 0,
    startedAt: initialProps.startedAt || Date.now(),
    endedAt: initialProps.endedAt || null,
    gameDuration: initialProps.gameDuration || null,
    pausedDurations: initialProps.pausedDurations || [],
  }

  if (initialProps.pausedAt) {
    props.pausedDurations = [
      ...props.pausedDurations,
      Date.now() - initialProps.pausedAt
    ]
  }

  const competitionId = toCompetitionId(props.t1, props.t2)

  const updateGame = () => api.updateCurrent(competitionId, props)

  const deleteGame = () => api.deleteCurrent(competitionId)

  const finalizeGame = () => {
    if (props.endedAt && props.gameDuration) {
      api.finalize(competitionId, props)
    }
  }

  const endGame = () => {
    props.endedAt = Date.now()
    props.gameDuration = props.pausedDurations.reduce((acc, cur) => acc + cur, 0)
  }

  const scorePoint = index => props[`t${index + 1}Points`]++

  const pauseGame = () => props.pausedAt = Date.now()

  return {
    updateGame,
    deleteGame,
    finalizeGame,
    endGame,
    pauseGame,
    scorePoint,
    competitionId,
    get props() {
      return props
    },
    get completed() {
      return props.endedAt !== null
    },
    get teamPoints() {
      return [props.t1Points, props.t2Points]
    }
  }
}

Game.initializeCompetition = async (t1, t2) => {
  const data = await api.initializeCompetition(toCompetitionId(t1, t2))
  return data
}

module.exports = Game
