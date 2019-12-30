const {
  INITIATE_GAME,
  BADGE_SCAN,
  ADD_PLAYER,
  APPEND_CHAR,
  BACKSPACE,
  SCORE_POINT,
  CONFIRM,
  DENY,
  MOVE_CURSOR,
  SWITCH_SIDES,
} = require('./actionTypes')

const {
  resetGame,
  addPlayer,
  appendCharacter,
  backspace,
  createPlayer,
  seedNewPlayer,
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

const { findNewOrCurrentGame, completeGame, findPlayer } = require('./services')
const { canActivate, notPresent, gameComplete } = require('./guards')

exports.gameConfig = {
  id: 'foosball',
  initial: 'inactive',
  context: {
    players: [],
    currentGame: null,
    bestOfLimit: 1, // how many games to play to
    cursorPosition: {
      x: 0,
      y: 0,
    },
    selectedPlayerIndices: [],
    newPlayer: {
      id: '',
      alias: '',
    }
  },
  states: {
    inactive: {
      on: {
        [INITIATE_GAME]: {
          target: 'pending',
          cond: canActivate
        },
        [BADGE_SCAN]: {
          target: 'findPlayer',
          cond: notPresent
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
    findPlayer: {
      invoke: {
        id: 'find-player',
        src: findPlayer,
        onDone: {
          target: 'inactive',
          actions: addPlayer
        },
        onError: 'registration'
      }
    },
    registration: {
      entry: seedNewPlayer,
      on: {
        [APPEND_CHAR]: {
          actions: appendCharacter
        },
        [BACKSPACE]: {
          actions: backspace
        },
        [CONFIRM]: {
          actions: createPlayer,
          target: 'inactive',
        },
      }
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
