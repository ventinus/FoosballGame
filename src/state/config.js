const { INITIATE_GAME, ADD_PLAYER, SCORE_POINT } = require('./actionTypes')
const {
  resetGame,
  addPlayer,
  scorePoint,
  updateScoreboard,
  updateGame,
  deleteGame,
  createGame,
  setGame,
  checkForWinner,
} = require('./actions')
const { getShouldResume, finalizeGame } = require('./services')
const { canActivate, gameComplete } = require('./guards')

exports.gameConfig = {
  id: 'foosball',
  initial: 'inactive',
  context: {
    playerIds: [],
    currentGame: null,
    bestOfLimit: 1, // how many games to play to
  },
  states: {
    inactive: {
      on: {
        [INITIATE_GAME]: {
          target: 'pending',
          cond: canActivate
        },
        [ADD_PLAYER]: {
          actions: addPlayer
        }
      }
    },
    pending: {
      invoke: {
        id: 'get-should-resume',
        src: getShouldResume,
        onDone: {
          target: 'active',
          actions: setGame,
        },
        onError: {
          target: 'active',
          actions: [deleteGame, createGame]
        }
      },
    },
    active: {
      entry: updateScoreboard,
      on: {
        '': {
          target: 'complete',
          cond: gameComplete,
        },
        [SCORE_POINT]: {
          actions: [scorePoint, updateScoreboard, updateGame],
        }
      }
    },
    complete: {
      exit: resetGame,
      invoke: {
        id: 'finalize-game',
        src: finalizeGame,
        onDone: 'inactive',
      }
    }
  }
}

exports.machineOptions = {
  actions: {},
  activities: {},
  guards: {},
  services: {},
}
