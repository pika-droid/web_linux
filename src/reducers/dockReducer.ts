import type { OSState, OSAction } from '@/types';

export function dockReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'PIN_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isPinned: true } : d
        ),
      };
    }

    case 'UNPIN_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isPinned: false } : d
        ),
      };
    }

    case 'BOUNCE_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, bounce: true } : { ...d, bounce: false }
        ),
      };
    }

    default:
      return state;
  }
}
