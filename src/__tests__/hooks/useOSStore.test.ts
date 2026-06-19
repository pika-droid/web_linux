import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { OSProvider, useOS, useWindows, useNotifications } from '../../hooks/useOSStore';
import { windowReducer } from '../../reducers/windowReducer';
import { dockReducer } from '../../reducers/dockReducer';
import { notificationReducer } from '../../reducers/notificationReducer';
import { desktopIconReducer } from '../../reducers/desktopIconReducer';
import { systemReducer } from '../../reducers/systemReducer';
import type { OSState } from '@/types';

// Create a minimal baseline state for sub-reducer testing
const createTestState = (): OSState => ({
  bootPhase: 'desktop',
  auth: { isAuthenticated: true, isGuest: false, userName: 'User' },
  windows: [],
  apps: [],
  desktopIcons: [],
  theme: { mode: 'dark', accent: '#7C4DFF', wallpaper: '/wallpaper-default.jpg' },
  notifications: [],
  dockItems: [],
  contextMenu: { visible: false, x: 0, y: 0, type: 'desktop', items: [] },
  appLauncherOpen: false,
  notificationCenterOpen: false,
  activeWindowId: null,
  nextZIndex: 100,
  isAltTabbing: false,
  altTabIndex: 0,
});

describe('systemReducer', () => {
  it('should handle SET_BOOT_PHASE', () => {
    const state = createTestState();
    const next = systemReducer(state, { type: 'SET_BOOT_PHASE', phase: 'login' });
    expect(next.bootPhase).toBe('login');
  });

  it('should handle LOGIN and LOGOUT', () => {
    const state = createTestState();
    state.bootPhase = 'login';
    state.auth = { isAuthenticated: false, isGuest: false, userName: 'User' };

    const loginNext = systemReducer(state, { type: 'LOGIN', isGuest: false });
    expect(loginNext.auth.isAuthenticated).toBe(true);
    expect(loginNext.auth.isGuest).toBe(false);
    expect(loginNext.bootPhase).toBe('desktop');

    const logoutNext = systemReducer(loginNext, { type: 'LOGOUT' });
    expect(logoutNext.auth.isAuthenticated).toBe(false);
    expect(logoutNext.bootPhase).toBe('login');
    expect(logoutNext.windows.length).toBe(0);
  });

  it('should handle SET_THEME and TOGGLE_THEME', () => {
    const state = createTestState();
    const themeNext = systemReducer(state, { type: 'SET_THEME', theme: { accent: '#ff0000' } });
    expect(themeNext.theme.accent).toBe('#ff0000');
    expect(themeNext.theme.mode).toBe('dark');

    const toggleNext = systemReducer(themeNext, { type: 'TOGGLE_THEME' });
    expect(toggleNext.theme.mode).toBe('light');
  });

  it('should handle SHOW_CONTEXT_MENU and HIDE_CONTEXT_MENU', () => {
    const state = createTestState();
    const showNext = systemReducer(state, {
      type: 'SHOW_CONTEXT_MENU',
      x: 100,
      y: 200,
      menuType: 'desktop',
      items: [{ id: '1', label: 'Test', action: 'test' }],
    });
    expect(showNext.contextMenu.visible).toBe(true);
    expect(showNext.contextMenu.x).toBe(100);
    expect(showNext.contextMenu.items.length).toBe(1);

    const hideNext = systemReducer(showNext, { type: 'HIDE_CONTEXT_MENU' });
    expect(hideNext.contextMenu.visible).toBe(false);
  });
});

describe('dockReducer', () => {
  it('should handle PIN_DOCK_ITEM and UNPIN_DOCK_ITEM', () => {
    const state = createTestState();
    state.dockItems = [{ appId: 'browser', isPinned: false, isOpen: false, isFocused: false, bounce: false }];

    const pinNext = dockReducer(state, { type: 'PIN_DOCK_ITEM', appId: 'browser' });
    expect(pinNext.dockItems[0].isPinned).toBe(true);

    const unpinNext = dockReducer(pinNext, { type: 'UNPIN_DOCK_ITEM', appId: 'browser' });
    expect(unpinNext.dockItems[0].isPinned).toBe(false);
  });

  it('should handle BOUNCE_DOCK_ITEM', () => {
    const state = createTestState();
    state.dockItems = [
      { appId: 'browser', isPinned: false, isOpen: false, isFocused: false, bounce: false },
      { appId: 'terminal', isPinned: false, isOpen: false, isFocused: false, bounce: false }
    ];

    const bounceNext = dockReducer(state, { type: 'BOUNCE_DOCK_ITEM', appId: 'browser' });
    expect(bounceNext.dockItems[0].bounce).toBe(true);
    expect(bounceNext.dockItems[1].bounce).toBe(false);
  });
});

describe('notificationReducer', () => {
  it('should handle ADD_NOTIFICATION, CLEAR_NOTIFICATIONS, REMOVE_NOTIFICATION, and MARK_NOTIFICATION_READ', () => {
    const state = createTestState();
    const notifData = { appId: 'test', appName: 'Test App', appIcon: 'Bell', title: 'Title', message: 'Message' };

    const addNext = notificationReducer(state, {
      type: 'ADD_NOTIFICATION',
      notification: notifData,
      id: 'notif-1',
      timestamp: 1000,
    } as any);

    expect(addNext.notifications.length).toBe(1);
    expect(addNext.notifications[0].id).toBe('notif-1');
    expect(addNext.notifications[0].timestamp).toBe(1000);
    expect(addNext.notifications[0].isRead).toBe(false);

    const readNext = notificationReducer(addNext, { type: 'MARK_NOTIFICATION_READ', id: 'notif-1' });
    expect(readNext.notifications[0].isRead).toBe(true);

    const removeNext = notificationReducer(readNext, { type: 'REMOVE_NOTIFICATION', id: 'notif-1' });
    expect(removeNext.notifications.length).toBe(0);

    // Clear notifications test
    const stateWithNotifs = createTestState();
    stateWithNotifs.notifications = [
      { id: '1', timestamp: 1, isRead: false, ...notifData },
      { id: '2', timestamp: 2, isRead: false, ...notifData },
    ];
    const clearNext = notificationReducer(stateWithNotifs, { type: 'CLEAR_NOTIFICATIONS' });
    expect(clearNext.notifications.length).toBe(0);
  });

  it('should enforce the maximum limit of 50 notifications', () => {
    let state = createTestState();
    const notifData = { appId: 'test', appName: 'Test App', appIcon: 'Bell', title: 'Title', message: 'Message' };

    for (let i = 0; i < 60; i++) {
      state = notificationReducer(state, {
        type: 'ADD_NOTIFICATION',
        notification: notifData,
        id: `notif-${i}`,
        timestamp: i,
      } as any);
    }

    expect(state.notifications.length).toBe(50);
    // The first element should be the newest one (notif-59)
    expect(state.notifications[0].id).toBe('notif-59');
  });
});

describe('desktopIconReducer', () => {
  it('should handle ADD_DESKTOP_ICON, SELECT_DESKTOP_ICON, UPDATE_DESKTOP_ICON_POSITION, and REMOVE_DESKTOP_ICON', () => {
    const state = createTestState();
    const iconData = { name: 'Folder', icon: 'Folder', appId: 'filemanager', position: { x: 10, y: 10 }, isSelected: false };

    const addNext = desktopIconReducer(state, {
      type: 'ADD_DESKTOP_ICON',
      icon: iconData,
      id: 'icon-1',
    } as any);

    expect(addNext.desktopIcons.length).toBe(1);
    expect(addNext.desktopIcons[0].id).toBe('icon-1');

    const selectNext = desktopIconReducer(addNext, { type: 'SELECT_DESKTOP_ICON', id: 'icon-1' });
    expect(selectNext.desktopIcons[0].isSelected).toBe(true);

    const positionNext = desktopIconReducer(selectNext, {
      type: 'UPDATE_DESKTOP_ICON_POSITION',
      id: 'icon-1',
      position: { x: 50, y: 50 },
    });
    expect(positionNext.desktopIcons[0].position).toEqual({ x: 50, y: 50 });

    const removeNext = desktopIconReducer(positionNext, { type: 'REMOVE_DESKTOP_ICON', id: 'icon-1' });
    expect(removeNext.desktopIcons.length).toBe(0);
  });
});

describe('windowReducer', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
    });
  });

  it('should handle window management flow (OPEN, FOCUS, MINIMIZE, MAXIMIZE, RESTORE, CLOSE)', () => {
    const state = createTestState();
    state.apps = [{ id: 'browser', name: 'Browser', icon: 'Globe', category: 'Internet', description: '', defaultSize: { width: 800, height: 600 }, minSize: { width: 300, height: 200 } }];
    state.dockItems = [{ appId: 'browser', isPinned: false, isOpen: false, isFocused: false, bounce: false }];

    // Open Window
    const openNext = windowReducer(state, {
      type: 'OPEN_WINDOW',
      appId: 'browser',
      windowId: 'win-1',
      createdAt: 1000,
      windowDimensions: { width: 1024, height: 768 },
    } as any);

    expect(openNext.windows.length).toBe(1);
    expect(openNext.windows[0].id).toBe('win-1');
    expect(openNext.windows[0].appId).toBe('browser');
    expect(openNext.activeWindowId).toBe('win-1');
    expect(openNext.dockItems[0].isOpen).toBe(true);
    expect(openNext.dockItems[0].isFocused).toBe(true);

    // Minimize Window
    const minNext = windowReducer(openNext, { type: 'MINIMIZE_WINDOW', windowId: 'win-1' });
    expect(minNext.windows[0].state).toBe('minimized');
    expect(minNext.activeWindowId).toBeNull();
    expect(minNext.dockItems[0].isFocused).toBe(false);

    // Focus / Restore Window
    const focusNext = windowReducer(minNext, { type: 'FOCUS_WINDOW', windowId: 'win-1' });
    expect(focusNext.windows[0].isFocused).toBe(true);
    expect(focusNext.activeWindowId).toBe('win-1');

    // Maximize Window
    const maxNext = windowReducer(focusNext, { type: 'MAXIMIZE_WINDOW', windowId: 'win-1' });
    expect(maxNext.windows[0].state).toBe('maximized');
    expect(maxNext.windows[0].position.x).toBe(0);

    // Restore Window
    const restoreNext = windowReducer(maxNext, { type: 'RESTORE_WINDOW', windowId: 'win-1' });
    expect(restoreNext.windows[0].state).toBe('normal');

    // Close Window
    const closeNext = windowReducer(restoreNext, { type: 'CLOSE_WINDOW', windowId: 'win-1' });
    expect(closeNext.windows.length).toBe(0);
    expect(closeNext.activeWindowId).toBeNull();
    expect(closeNext.dockItems[0].isOpen).toBe(false);
  });

  it('should handle Alt-Tab cycles', () => {
    let state = createTestState();
    state.windows = [
      { id: 'w1', appId: 'a1', title: 'W1', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, state: 'normal', isFocused: false, zIndex: 1, icon: '', createdAt: 1 },
      { id: 'w2', appId: 'a2', title: 'W2', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, state: 'normal', isFocused: true, zIndex: 2, icon: '', createdAt: 2 },
    ];

    // Start Alt-Tab
    state = windowReducer(state, { type: 'START_ALT_TAB' });
    expect(state.isAltTabbing).toBe(true);
    expect(state.altTabIndex).toBe(1); // Points to last index (w2)

    // Cycle Alt-Tab
    state = windowReducer(state, { type: 'CYCLE_ALT_TAB' });
    expect(state.altTabIndex).toBe(0); // Cycles back to w1

    // End Alt-Tab
    state = windowReducer(state, { type: 'END_ALT_TAB' });
    expect(state.isAltTabbing).toBe(false);
    expect(state.activeWindowId).toBe('w1');
    expect(state.windows.find(w => w.id === 'w1')?.isFocused).toBe(true);
  });
});

describe('Reducer Purity & React StrictMode Double-Run Safety', () => {
  it('should produce identical state and not duplicate entries when run twice (StrictMode safety)', () => {
    const state = createTestState();
    const notifAction = {
      type: 'ADD_NOTIFICATION',
      notification: { appId: 'test', appName: 'Test', appIcon: 'Bell', title: 'Title', message: 'Message' },
      id: 'notif-purity-1',
      timestamp: 9999,
    } as any;

    const run1 = notificationReducer(state, notifAction);
    const run2 = notificationReducer(state, notifAction);

    expect(run1.notifications.length).toBe(1);
    expect(run1.notifications[0].id).toBe('notif-purity-1');
    expect(run2.notifications.length).toBe(1);
    expect(run2.notifications[0].id).toBe('notif-purity-1');
    expect(run1).toEqual(run2);

    const iconAction = {
      type: 'ADD_DESKTOP_ICON',
      icon: { name: 'Test', icon: 'File', appId: 'test', position: { x: 10, y: 10 }, isSelected: false },
      id: 'icon-purity-1',
    } as any;

    const runIcon1 = desktopIconReducer(state, iconAction);
    const runIcon2 = desktopIconReducer(state, iconAction);

    expect(runIcon1.desktopIcons.length).toBe(1);
    expect(runIcon1.desktopIcons[0].id).toBe('icon-purity-1');
    expect(runIcon2.desktopIcons.length).toBe(1);
    expect(runIcon2.desktopIcons[0].id).toBe('icon-purity-1');
    expect(runIcon1).toEqual(runIcon2);
  });

  it('should be free of side-effects like writing to localStorage', () => {
    const state = createTestState();
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    desktopIconReducer(state, {
      type: 'ADD_DESKTOP_ICON',
      icon: { name: 'Folder', icon: 'Folder', position: { x: 10, y: 10 }, isSelected: false },
      id: 'icon-side-effect',
    } as any);

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});

describe('OS Context & Hooks Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize and manage state via OSProvider and hooks', () => {
    const { result } = renderHook(
      () => {
        const os = useOS();
        const win = useWindows();
        const notif = useNotifications();
        return { os, win, notif };
      },
      { wrapper: OSProvider }
    );

    // Initial state check
    expect(result.current.os.state.bootPhase).toBe('off');

    // Boot & Login
    act(() => {
      result.current.os.dispatch({ type: 'SET_BOOT_PHASE', phase: 'login' });
    });
    expect(result.current.os.state.bootPhase).toBe('login');

    act(() => {
      result.current.os.dispatch({ type: 'LOGIN', isGuest: false });
    });
    expect(result.current.os.state.bootPhase).toBe('desktop');
    expect(result.current.os.state.auth.isAuthenticated).toBe(true);

    // Notification integration (custom dispatch auto-generates ID)
    act(() => {
      result.current.notif.addNotification({
        appId: 'test',
        appName: 'Test App',
        appIcon: 'Bell',
        title: 'Integration',
        message: 'Works!',
      });
    });

    expect(result.current.os.state.notifications.length).toBe(1);
    expect(result.current.os.state.notifications[0].id).toBeDefined();
    expect(result.current.os.state.notifications[0].timestamp).toBeDefined();

    // Desktop icons persistence via useEffect
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    act(() => {
      result.current.os.dispatch({
        type: 'ADD_DESKTOP_ICON',
        icon: { name: 'New Link', icon: 'Globe', position: { x: 100, y: 100 }, isSelected: false },
      });
    });

    // The state updates, triggering the useEffect in OSProvider
    expect(result.current.os.state.desktopIcons.length).toBeGreaterThan(0);
    // Expect localStorage update to be triggered by useEffect
    expect(setItemSpy).toHaveBeenCalledWith('ubuntuos_desktop_icons', expect.any(String));
  });
});
