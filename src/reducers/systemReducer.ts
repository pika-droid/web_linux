import type { OSState, OSAction } from '@/types';

export function systemReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'SET_BOOT_PHASE': {
      return { ...state, bootPhase: action.phase };
    }

    case 'LOGIN': {
      return {
        ...state,
        auth: { isAuthenticated: true, isGuest: action.isGuest, userName: action.isGuest ? 'Guest' : 'User' },
        bootPhase: 'desktop',
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        auth: { isAuthenticated: false, isGuest: false, userName: 'User' },
        windows: [],
        bootPhase: 'login',
        activeWindowId: null,
      };
    }

    case 'SET_THEME': {
      return { ...state, theme: { ...state.theme, ...action.theme } };
    }

    case 'TOGGLE_THEME': {
      const mode = state.theme.mode === 'dark' ? 'light' : 'dark';
      return { ...state, theme: { ...state.theme, mode } };
    }

    case 'SHOW_CONTEXT_MENU': {
      return {
        ...state,
        contextMenu: {
          visible: true,
          x: action.x,
          y: action.y,
          type: action.menuType,
          items: action.items,
          contextData: action.contextData,
        },
      };
    }

    case 'HIDE_CONTEXT_MENU': {
      return { ...state, contextMenu: { ...state.contextMenu, visible: false } };
    }

    case 'TOGGLE_APP_LAUNCHER': {
      return { ...state, appLauncherOpen: !state.appLauncherOpen };
    }

    case 'SET_APP_LAUNCHER': {
      return { ...state, appLauncherOpen: action.open };
    }

    case 'TOGGLE_NOTIFICATION_CENTER': {
      return { ...state, notificationCenterOpen: !state.notificationCenterOpen };
    }

    default:
      return state;
  }
}
