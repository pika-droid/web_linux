import type { OSState, OSAction, DesktopIcon } from '@/types';

export function desktopIconReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'ADD_DESKTOP_ICON': {
      const id = (action as any).id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      const icon: DesktopIcon = { ...action.icon, id };
      return { ...state, desktopIcons: [...state.desktopIcons, icon] };
    }

    case 'REMOVE_DESKTOP_ICON': {
      return { ...state, desktopIcons: state.desktopIcons.filter((i) => i.id !== action.id) };
    }

    case 'UPDATE_DESKTOP_ICON_POSITION': {
      return {
        ...state,
        desktopIcons: state.desktopIcons.map((i) =>
          i.id === action.id ? { ...i, position: action.position } : i
        ),
      };
    }

    case 'SELECT_DESKTOP_ICON': {
      return {
        ...state,
        desktopIcons: state.desktopIcons.map((i) =>
          ({ ...i, isSelected: i.id === action.id })
        ),
      };
    }

    default:
      return state;
  }
}
