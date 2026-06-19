import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AppRouter from '../../apps/AppRouter';

// Mock one of the app components to spy on its props
vi.mock('../../apps/Terminal', () => {
  return {
    default: (props: any) => (
      <div data-testid="mock-terminal" data-window-id={props.windowId}>
        Mock Terminal
      </div>
    ),
  };
});

describe('AppRouter', () => {
  it('propagates windowId prop to routed app components', () => {
    render(<AppRouter appId="terminal" windowId="test-window-123" />);

    const terminalEl = screen.getByTestId('mock-terminal');
    expect(terminalEl).toBeDefined();
    expect(terminalEl.getAttribute('data-window-id')).toBe('test-window-123');
  });
});
