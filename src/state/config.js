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
  GAME_ACTIVITY,
  WARN_PAUSE,
  PAUSE,
} = require('./actionTypes')

const {
  resetGame,
  addPlayer,
  appendCharacter,
  backspace,
  createPlayer,
  seedNewPlayer,
  updateCompetition,
  promptSearching,
  promptAliasInput,
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
  setWarning,
  pauseGame,
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
      entry: updateCompetition,
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
          actions: [switchSides, updateCompetition]
        },
        [MOVE_CURSOR]: {
          actions: [moveCursor, updateCompetition]
        },
        [CONFIRM]: {
          actions: [setSelectedPlayer, exchangePlayers, resetSelectedPlayers, updateCompetition]
        },
      },
    },
    findPlayer: {
      entry: promptSearching,
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
      entry: [seedNewPlayer, promptAliasInput],
      on: {
        [APPEND_CHAR]: {
          actions: [appendCharacter, promptAliasInput]
        },
        [BACKSPACE]: {
          actions: [backspace, promptAliasInput]
        },
        [CONFIRM]: {
          actions: createPlayer,
          target: 'inactive',
        },
      }
    },
    pending: {
      exit: [setGame, updateScoreboard],
      invoke: {
        id: 'find-new-or-current-game',
        src: findNewOrCurrentGame,
        onDone: 'active',
        onError: 'shouldResume',
      },
    },
    shouldResume: {
      entry: promptResume,
      exit: [clearPrompt],
      on: {
        [CONFIRM]: 'active',
        [DENY]: {
          target: 'active',
          actions: [deleteGame, createGame],
        },
      },
    },
    active: {
      entry: updateCompetition,
      on: {
        '': {
          target: 'complete',
          cond: gameComplete,
        },
        [SCORE_POINT]: {
          actions: [scorePoint, updateScoreboard, updateGame],
        },
        [WARN_PAUSE]: 'pauseWarning'
      }
    },
    pauseWarning: {
      entry: setWarning(true),
      exit: setWarning(false),
      on: {
        [CONFIRM]: 'active',
        [GAME_ACTIVITY]: 'active',
        [DENY]: {
          actions: [pauseGame, resetGame],
          target: 'inactive'
        },
        [PAUSE]: {
          actions: [pauseGame, resetGame],
          target: 'inactive'
        },
      },
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
