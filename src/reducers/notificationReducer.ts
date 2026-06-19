import type { OSState, OSAction, Notification } from '@/types';

export function notificationReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const id = (action as any).id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      const timestamp = (action as any).timestamp || Date.now();
      const notif: Notification = {
        ...action.notification,
        id,
        timestamp,
        isRead: false,
      };
      return { ...state, notifications: [notif, ...state.notifications].slice(0, 50) };
    }

    case 'REMOVE_NOTIFICATION': {
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    }

    case 'CLEAR_NOTIFICATIONS': {
      return { ...state, notifications: [] };
    }

    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, isRead: true } : n
        ),
      };
    }

    default:
      return state;
  }
}
