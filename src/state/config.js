const {
  INITIATE_GAME,
  ADD_PLAYER,
  SCORE_POINT,
  CONFIRM,
  DENY,
  MOVE_CURSOR,
  SWITCH_SIDES,
} = require('./actionTypes')

const {
  resetGame,
  addPlayer,
  switchSides,
  moveCursor,
  setSelectedPlayer,
  exchangePlayers,
  resetSelectedPlayers,
  promptResume,
  clearPrompt,
  scorePoint,
  updateScoreboard,
  updateGame,
  deleteGame,
  createGame,
  setGame,
  checkForWinner,
} = require('./actions')

const { findNewOrCurrentGame, completeGame } = require('./services')
const { canActivate, gameComplete } = require('./guards')

exports.gameConfig = {
  id: 'foosball',
  initial: 'inactive',
  context: {
    playerIds: [],
    currentGame: null,
    bestOfLimit: 1, // how many games to play to
    cursorPosition: {
      x: 0,
      y: 0,
    },
    selectedPlayerIndices: []
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
        },
        [SWITCH_SIDES]: {
          actions: switchSides
        },
        [MOVE_CURSOR]: {
          actions: moveCursor
        },
        [CONFIRM]: {
          actions: [setSelectedPlayer, exchangePlayers, resetSelectedPlayers]
        },

      },
    },
    pending: {
      invoke: {
        id: 'find-new-or-current-game',
        src: findNewOrCurrentGame,
        onDone: 'active',
        onError: 'shouldResume',
      },
      exit: [setGame, updateScoreboard],
    },
    shouldResume: {
      entry: promptResume,
      exit: clearPrompt,
      on: {
        [CONFIRM]: {
          target: 'active',
        },
        [DENY]: {
          target: 'active',
          actions: [deleteGame, createGame],
        },
      },
    },
    active: {
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
        id: 'complete-game',
        src: completeGame,
        onDone: 'inactive',
      }
    }
  }
}
