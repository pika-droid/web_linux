import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

const ExplodingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Boom!');
  }
  return <div>Safe Content</div>;
};

const TestApp = () => {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <span>Application Crash</span>
          <span>{error.message}</span>
          <button onClick={() => {
            setShouldThrow(false);
            reset();
          }}>
            Restart Application
          </button>
        </div>
      )}
    >
      <ExplodingComponent shouldThrow={shouldThrow} />
    </ErrorBoundary>
  );
};

describe('ErrorBoundary', () => {
  it('catches render exceptions, displays fallback UI, and allows restart', () => {
    // Silence console.error for clean test logs
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestApp />);

    // Assert fallback elements are in the document
    expect(screen.getByText('Application Crash')).toBeDefined();
    expect(screen.getByText('Boom!')).toBeDefined();
    expect(screen.queryByText('Safe Content')).toBeNull();

    // Click restart to recover
    const restartBtn = screen.getByRole('button', { name: 'Restart Application' });
    fireEvent.click(restartBtn);

    // Verify recovery and rendering of safe content
    expect(screen.getByText('Safe Content')).toBeDefined();
    expect(screen.queryByText('Application Crash')).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});
