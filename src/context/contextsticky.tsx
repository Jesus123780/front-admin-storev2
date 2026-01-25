import PropTypes from 'prop-types'
import {
  createContext,
  useContext,
  useReducer
} from 'react'

const initialState: ReducerInterface = {
  containerRef: null,
  stickyRefs: new Map<React.RefObject<HTMLElement>, React.RefObject<HTMLElement>>(),
  debug: false
}

// No operation
const noop = () => { return }

type StickyDispatch = {
  setContainerRef: (containerRef: React.RefObject<HTMLElement>) => void;
  addStickyRef: (
    topSentinelRef: React.RefObject<HTMLElement>,
    bottomSentinelRef: React.RefObject<HTMLElement>,
    stickyRef: React.RefObject<HTMLElement>
  ) => void;
  toggleDebug: () => void;
};

const initialDispatch: StickyDispatch = {
  setContainerRef: noop,
  addStickyRef: noop,
  toggleDebug: noop
};

const StickyStateContext = createContext<ReducerInterface>(initialState);
const StickyDispatchContext = createContext<StickyDispatch>(initialDispatch);

const ActionType = {
  setContainerRef: 'set container ref',
  addStickyRef: 'add sticky ref',
  toggleDebug: 'toggle debug'
}

interface ReducerInterface {
  containerRef: React.RefObject<HTMLElement> | null;
  stickyRefs: Map<React.RefObject<HTMLElement>, React.RefObject<HTMLElement>>;
  debug: boolean;
}

function reducer(state: ReducerInterface, action: { type: string; payload: unknown }) {
  const { type, payload } = action
  switch (type) {
    case ActionType.setContainerRef:
      // Reassigning a new ref, will infinitely re-load!
      return Object.assign(state, {
        containerRef: { current: (payload as { containerRef: React.RefObject<HTMLElement> }).containerRef }
      })
    case ActionType.addStickyRef: {
      const { topSentinelRef, bottomSentinelRef, stickyRef } = payload as {
        topSentinelRef: React.RefObject<HTMLElement>;
        bottomSentinelRef: React.RefObject<HTMLElement>;
        stickyRef: React.RefObject<HTMLElement>;
      }

      if (topSentinelRef && bottomSentinelRef && stickyRef) {
        state.stickyRefs.set(topSentinelRef, stickyRef)
        state.stickyRefs.set(bottomSentinelRef, stickyRef)
      }

      return Object.assign(state, {
        stickyRefs: state.stickyRefs
      })
    }
    case ActionType.toggleDebug:
      return { ...state, debug: !state.debug }
    default:
      return state
  }
}

interface StickyProviderProps {
  children: React.ReactNode
}
const StickyProvider: React.FC<StickyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  interface SetContainerRefPayload {
    containerRef: React.RefObject<HTMLElement>;
  }

  interface SetContainerRefAction {
    type: typeof ActionType.setContainerRef;
    payload: SetContainerRefPayload;
  }

  const setContainerRef = (containerRef: React.RefObject<HTMLElement>) => {
    return dispatch({
      type: ActionType.setContainerRef,
      payload: { containerRef }
    } as SetContainerRefAction);
  }

  const addStickyRef = (
    topSentinelRef: React.RefObject<HTMLElement>,
    bottomSentinelRef: React.RefObject<HTMLElement>,
    stickyRef: React.RefObject<HTMLElement>
  ) => {
    return dispatch({
      type: ActionType.addStickyRef,
      payload: { topSentinelRef, bottomSentinelRef, stickyRef }
    } as const)
  }

  const toggleDebug = () => { return dispatch({ type: ActionType.toggleDebug, payload: undefined }) }

  const actions = {
    setContainerRef,
    addStickyRef,
    toggleDebug
  } as const
  return (
    <StickyStateContext.Provider value={state as ReducerInterface}>
      <StickyDispatchContext.Provider value={actions}>
        {children}
      </StickyDispatchContext.Provider>
    </StickyStateContext.Provider>
  )
}

StickyProvider.propTypes = {
  children: PropTypes.any
}

function useStickyState() {
  const context = useContext(StickyStateContext)
  if (context === undefined) { throw Error('"useStickyState should be used under "StickyStateContext') }
  return context
}

function useStickyActions() {
  const context = useContext(StickyDispatchContext)
  if (context === undefined) {
    throw Error(
      '"useStickyActions should be used under "StickyDispatchContext'
    )
  }
  return context
}

const initialSectionValues = {
  topSentinelRef: null,
  bottomSentinelRef: null
}

const StickySectionContext = createContext(initialSectionValues)

export {
  ActionType,
  StickyProvider,
  StickySectionContext,
  useStickyActions,
  useStickyState
}
