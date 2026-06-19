// ============================================================
// OS State Management — React Context + useReducer
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { OSState, OSAction, Window, DesktopIcon, Notification, DockItem, WindowState } from '@/types';
import { APP_REGISTRY, getAppById, getDefaultDockApps } from '@/apps/registry';
import { windowReducer } from '@/reducers/windowReducer';
import { dockReducer } from '@/reducers/dockReducer';
import { notificationReducer } from '@/reducers/notificationReducer';
import { desktopIconReducer } from '@/reducers/desktopIconReducer';
import { systemReducer } from '@/reducers/systemReducer';

// ---- Helpers ----
const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---- Initial State ----
const defaultDesktopIcons: DesktopIcon[] = [
  { id: 'desk-home', name: 'Home', icon: 'Home', appId: 'filemanager', position: { x: 16, y: 16 }, isSelected: false },
  { id: 'desk-trash', name: 'Trash', icon: 'Trash2', appId: 'filemanager', position: { x: 16, y: 106 }, isSelected: false },
  { id: 'desk-text', name: 'Text Editor', icon: 'FileText', appId: 'texteditor', position: { x: 16, y: 196 }, isSelected: false },
  { id: 'desk-terminal', name: 'Terminal', icon: 'Terminal', appId: 'terminal', position: { x: 16, y: 286 }, isSelected: false },
  { id: 'desk-settings', name: 'Settings', icon: 'Settings', appId: 'settings', position: { x: 96, y: 16 }, isSelected: false },
  { id: 'desk-browser', name: 'Web Browser', icon: 'Globe', appId: 'browser', position: { x: 96, y: 106 }, isSelected: false },
  { id: 'desk-calendar', name: 'Calendar', icon: 'Calendar', appId: 'calendar', position: { x: 96, y: 196 }, isSelected: false },
];

const createInitialDockItems = (): DockItem[] => {
  const pinned = getDefaultDockApps();
  return APP_REGISTRY.map((app) => ({
    appId: app.id,
    isPinned: pinned.includes(app.id),
    isOpen: false,
    isFocused: false,
    bounce: false,
  }));
};

const loadDesktopIcons = (): DesktopIcon[] => {
  try {
    const saved = localStorage.getItem('ubuntuos_desktop_icons');
    if (saved) return JSON.parse(saved) as DesktopIcon[];
  } catch { /* ignore */ }
  return defaultDesktopIcons;
};

const initialState: OSState = {
  bootPhase: 'off',
  auth: { isAuthenticated: false, isGuest: false, userName: 'User' },
  windows: [],
  apps: APP_REGISTRY,
  desktopIcons: loadDesktopIcons(),
  theme: {
    mode: 'dark',
    accent: '#7C4DFF',
    wallpaper: '/wallpaper-default.jpg',
  },
  notifications: [],
  dockItems: createInitialDockItems(),
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    type: 'desktop',
    items: [],
  },
  appLauncherOpen: false,
  notificationCenterOpen: false,
  activeWindowId: null,
  nextZIndex: 100,
  isAltTabbing: false,
  altTabIndex: 0,
};

// ---- Reducer ----
function osReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'SET_BOOT_PHASE':
    case 'LOGIN':
    case 'LOGOUT':
    case 'SET_THEME':
    case 'TOGGLE_THEME':
    case 'SHOW_CONTEXT_MENU':
    case 'HIDE_CONTEXT_MENU':
    case 'TOGGLE_APP_LAUNCHER':
    case 'SET_APP_LAUNCHER':
    case 'TOGGLE_NOTIFICATION_CENTER':
      return systemReducer(state, action);

    case 'OPEN_WINDOW':
    case 'CLOSE_WINDOW':
    case 'MINIMIZE_WINDOW':
    case 'MAXIMIZE_WINDOW':
    case 'RESTORE_WINDOW':
    case 'FOCUS_WINDOW':
    case 'MOVE_WINDOW':
    case 'RESIZE_WINDOW':
    case 'SET_ACTIVE_WINDOW':
    case 'CASCADE_WINDOWS':
    case 'MINIMIZE_ALL':
    case 'START_ALT_TAB':
    case 'CYCLE_ALT_TAB':
    case 'END_ALT_TAB':
      return windowReducer(state, action);

    case 'PIN_DOCK_ITEM':
    case 'UNPIN_DOCK_ITEM':
    case 'BOUNCE_DOCK_ITEM':
      return dockReducer(state, action);

    case 'ADD_NOTIFICATION':
    case 'REMOVE_NOTIFICATION':
    case 'CLEAR_NOTIFICATIONS':
    case 'MARK_NOTIFICATION_READ':
      return notificationReducer(state, action);

    case 'ADD_DESKTOP_ICON':
    case 'REMOVE_DESKTOP_ICON':
    case 'UPDATE_DESKTOP_ICON_POSITION':
    case 'SELECT_DESKTOP_ICON':
      return desktopIconReducer(state, action);

    default:
      return state;
  }
}

// ---- Context ----
interface OSContextType {
  state: OSState;
  dispatch: React.Dispatch<OSAction>;
}

const OSContext = createContext<OSContextType | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(osReducer, initialState);

  // Persistence effect for desktop icons
  useEffect(() => {
    try {
      localStorage.setItem('ubuntuos_desktop_icons', JSON.stringify(state.desktopIcons));
    } catch (e) {
      console.error('Failed to save desktop icons to localStorage:', e);
    }
  }, [state.desktopIcons]);

  const customDispatch = useCallback((action: OSAction) => {
    let enrichedAction = { ...action };

    if (action.type === 'OPEN_WINDOW') {
      enrichedAction = {
        ...action,
        windowId: (action as any).windowId || generateId(),
        createdAt: (action as any).createdAt || Date.now(),
        windowDimensions: (action as any).windowDimensions || {
          width: typeof window !== 'undefined' ? window.innerWidth : 1024,
          height: typeof window !== 'undefined' ? window.innerHeight : 768,
        },
      } as any;
    } else if (action.type === 'ADD_NOTIFICATION') {
      enrichedAction = {
        ...action,
        id: (action as any).id || generateId(),
        timestamp: (action as any).timestamp || Date.now(),
      } as any;
    } else if (action.type === 'ADD_DESKTOP_ICON') {
      enrichedAction = {
        ...action,
        id: (action as any).id || generateId(),
      } as any;
    }

    dispatch(enrichedAction as OSAction);
  }, [dispatch]);

  return (
    <OSContext.Provider value={{ state, dispatch: customDispatch }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
};

// ---- Convenience hooks ----
export const useWindows = () => {
  const { state, dispatch } = useOS();
  return {
    windows: state.windows,
    openWindow: useCallback((appId: string, title?: string) => dispatch({ type: 'OPEN_WINDOW', appId, title }), [dispatch]),
    closeWindow: useCallback((windowId: string) => dispatch({ type: 'CLOSE_WINDOW', windowId }), [dispatch]),
    minimizeWindow: useCallback((windowId: string) => dispatch({ type: 'MINIMIZE_WINDOW', windowId }), [dispatch]),
    maximizeWindow: useCallback((windowId: string) => dispatch({ type: 'MAXIMIZE_WINDOW', windowId }), [dispatch]),
    restoreWindow: useCallback((windowId: string) => dispatch({ type: 'RESTORE_WINDOW', windowId }), [dispatch]),
    focusWindow: useCallback((windowId: string) => dispatch({ type: 'FOCUS_WINDOW', windowId }), [dispatch]),
    moveWindow: useCallback((windowId: string, position: { x: number; y: number }) => dispatch({ type: 'MOVE_WINDOW', windowId, position }), [dispatch]),
    resizeWindow: useCallback((windowId: string, size: { width: number; height: number }) => dispatch({ type: 'RESIZE_WINDOW', windowId, size }), [dispatch]),
    activeWindowId: state.activeWindowId,
  };
};

export const useNotifications = () => {
  const { state, dispatch } = useOS();
  return {
    notifications: state.notifications,
    addNotification: useCallback(
      (n: Omit<Notification, 'id' | 'timestamp'>) => dispatch({ type: 'ADD_NOTIFICATION', notification: n }),
      [dispatch]
    ),
    removeNotification: useCallback((id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', id }), [dispatch]),
    clearNotifications: useCallback(() => dispatch({ type: 'CLEAR_NOTIFICATIONS' }), [dispatch]),
  };
};
