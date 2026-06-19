import type { OSState, OSAction, Window, WindowState } from '@/types';
import { getAppById } from '@/apps/registry';

const TOP_PANEL_HEIGHT = 28;

const createWindow = (
  state: OSState,
  appId: string,
  windowId: string,
  createdAt: number,
  windowDimensions: { width: number; height: number },
  title?: string
): Window => {
  const app = getAppById(appId);
  if (!app) throw new Error(`Unknown app: ${appId}`);
  const vw = windowDimensions.width;
  const vh = windowDimensions.height;
  const offset = (state.windows.filter((w) => w.appId === appId && w.state !== 'minimized').length) * 30;
  const x = Math.max(20, Math.min(vw - app.defaultSize.width - 20, 60 + offset));
  const y = Math.max(TOP_PANEL_HEIGHT + 10, Math.min(vh - app.defaultSize.height - 60, 40 + offset));
  return {
    id: windowId,
    appId,
    title: title || app.name,
    position: { x, y },
    size: { ...app.defaultSize },
    state: 'normal',
    isFocused: true,
    zIndex: state.nextZIndex,
    icon: app.icon,
    createdAt,
  };
};

export function windowReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const windowId = (action as any).windowId || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      const createdAt = (action as any).createdAt || Date.now();
      const windowDimensions = (action as any).windowDimensions || {
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
      };

      const win = createWindow(state, action.appId, windowId, createdAt, windowDimensions, action.title);
      const newWindows = state.windows.map((w) => ({ ...w, isFocused: false }));
      const updatedDock = state.dockItems.map((d) =>
        d.appId === action.appId ? { ...d, isOpen: true, isFocused: true, bounce: true } : { ...d, isFocused: false }
      );
      return {
        ...state,
        windows: [...newWindows, win],
        activeWindowId: win.id,
        nextZIndex: state.nextZIndex + 1,
        dockItems: updatedDock,
      };
    }

    case 'CLOSE_WINDOW': {
      const appId = state.windows.find((w) => w.id === action.windowId)?.appId;
      const remaining = state.windows.filter((w) => w.id !== action.windowId);
      const hasOtherWindows = remaining.some((w) => w.appId === appId && w.state !== 'minimized');
      let updatedDock = state.dockItems;
      if (appId && !hasOtherWindows) {
        updatedDock = state.dockItems.map((d) =>
          d.appId === appId ? { ...d, isOpen: false, isFocused: false } : d
        );
      }
      const newActiveId = remaining.length > 0
        ? remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
        : null;
      return {
        ...state,
        windows: remaining,
        activeWindowId: newActiveId,
        dockItems: updatedDock,
      };
    }

    case 'MINIMIZE_WINDOW': {
      const win = state.windows.find((w) => w.id === action.windowId);
      if (!win) return state;
      const updated = state.windows.map((w) =>
        w.id === action.windowId
          ? { ...w, state: 'minimized' as WindowState, isFocused: false, prevPosition: { ...w.position }, prevSize: { ...w.size } }
          : w
      );
      const appId = win.appId;
      const hasVisible = updated.some((w) => w.appId === appId && w.state !== 'minimized');
      const updatedDock = state.dockItems.map((d) =>
        d.appId === appId ? { ...d, isFocused: hasVisible, isOpen: hasVisible || d.isPinned } : d
      );
      const newActiveId = updated
        .filter((w) => w.state !== 'minimized')
        .reduce((a, b) => (a && a.zIndex > b.zIndex ? a : b), null as Window | null);
      return { ...state, windows: updated, activeWindowId: newActiveId?.id ?? null, dockItems: updatedDock };
    }

    case 'MAXIMIZE_WINDOW': {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? {
                ...w,
                state: 'maximized' as WindowState,
                prevPosition: { ...w.position },
                prevSize: { ...w.size },
                position: { x: 0, y: TOP_PANEL_HEIGHT },
                size: { width: vw, height: vh - TOP_PANEL_HEIGHT - 48 },
              }
            : w
        ),
      };
    }

    case 'RESTORE_WINDOW': {
      const win = state.windows.find((w) => w.id === action.windowId);
      if (!win) return state;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? {
                ...w,
                state: 'normal' as WindowState,
                position: win.prevPosition || w.position,
                size: win.prevSize || w.size,
                prevPosition: undefined,
                prevSize: undefined,
              }
            : w
        ),
      };
    }

    case 'FOCUS_WINDOW': {
      const nextZ = state.nextZIndex + 1;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? { ...w, isFocused: true, zIndex: nextZ }
            : { ...w, isFocused: false }
        ),
        activeWindowId: action.windowId,
        nextZIndex: nextZ,
        dockItems: state.dockItems.map((d) => {
          const isThisApp = state.windows.some((w) => w.id === action.windowId && w.appId === d.appId);
          return { ...d, isFocused: isThisApp };
        }),
      };
    }

    case 'MOVE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId ? { ...w, position: action.position } : w
        ),
      };
    }

    case 'RESIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId ? { ...w, size: action.size } : w
        ),
      };
    }

    case 'SET_ACTIVE_WINDOW': {
      return {
        ...state,
        activeWindowId: action.windowId,
        windows: state.windows.map((w) => ({ ...w, isFocused: w.id === action.windowId })),
      };
    }

    case 'START_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      return {
        ...state,
        isAltTabbing: true,
        altTabIndex: visibleWins.length > 0 ? visibleWins.length - 1 : 0,
      };
    }

    case 'CYCLE_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      return {
        ...state,
        altTabIndex: visibleWins.length > 0
          ? (state.altTabIndex + 1) % visibleWins.length
          : 0,
      };
    }

    case 'END_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      const target = visibleWins[state.altTabIndex];
      return {
        ...state,
        isAltTabbing: false,
        altTabIndex: 0,
        ...(target ? {
          activeWindowId: target.id,
          windows: state.windows.map((w) =>
            w.id === target.id ? { ...w, isFocused: true, zIndex: state.nextZIndex } : { ...w, isFocused: false }
          ),
          nextZIndex: state.nextZIndex + 1,
        } : {}),
      };
    }

    case 'CASCADE_WINDOWS': {
      let z = state.nextZIndex;
      const updated = state.windows.map((w, i) => ({
        ...w,
        position: { x: 40 + i * 30, y: TOP_PANEL_HEIGHT + 20 + i * 30 },
        zIndex: z++,
        isFocused: i === state.windows.length - 1,
      }));
      return {
        ...state,
        windows: updated,
        activeWindowId: updated.length > 0 ? updated[updated.length - 1].id : null,
        nextZIndex: z,
      };
    }

    case 'MINIMIZE_ALL': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.state !== 'minimized'
            ? { ...w, state: 'minimized' as WindowState, isFocused: false }
            : w
        ),
        activeWindowId: null,
        dockItems: state.dockItems.map((d) => ({ ...d, isFocused: false })),
      };
    }

    default:
      return state;
  }
}
