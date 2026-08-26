import { createContext, useContext, useReducer } from 'react';

/**
 * RoomContext — centralised state for the room page.
 *
 * State shape:
 *   roomId, code, language, participants, output,
 *   isCompiling, connectionStatus, toasts
 *
 * Updated by dispatching actions (usually from WebSocket messages).
 */

const RoomContext = createContext(null);

const initialState = {
  roomId: null,
  code: '',
  language: 'cpp',
  participants: [],
  output: '',
  isCompiling: false,
  connectionStatus: 'connecting',
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    // Full room snapshot received when joining
    case 'ROOM_STATE':
      return {
        ...state,
        roomId: action.payload.roomId,
        code: action.payload.code,
        language: action.payload.language,
        participants: action.payload.participants,
        output: action.payload.output || '',
      };

    case 'USER_JOINED':
      return {
        ...state,
        participants: action.payload.participants,
        toasts: [...state.toasts, {
          id: Date.now(),
          message: `${action.payload.username} joined`,
          type: 'info',
        }],
      };

    case 'USER_LEFT':
      return {
        ...state,
        participants: action.payload.participants,
        toasts: [...state.toasts, {
          id: Date.now(),
          message: `${action.payload.username} left`,
          type: 'info',
        }],
      };

    case 'CODE_UPDATED':
      return { ...state, code: action.payload.code };

    case 'LANGUAGE_UPDATED':
      return {
        ...state,
        language: action.payload.language,
        code: action.payload.code,
      };

    case 'OUTPUT_UPDATED':
      return {
        ...state,
        output: action.payload.output,
        isCompiling: action.payload.output === 'Compiling...',
      };

    case 'ERROR':
      return {
        ...state,
        toasts: [...state.toasts, {
          id: Date.now(),
          message: action.payload.message,
          type: 'error',
        }],
      };

    // Local actions (not from WebSocket)
    case 'SET_CODE':
      return { ...state, code: action.payload };

    case 'SET_COMPILING':
      return { ...state, isCompiling: action.payload };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };

    default:
      return state;
  }
}

export function RoomProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <RoomContext.Provider value={{ state, dispatch }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
