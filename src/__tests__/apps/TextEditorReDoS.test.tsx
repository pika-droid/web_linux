import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VFSProvider } from '../../hooks/useFileSystem';
import TextEditor from '../../apps/TextEditor';

describe('TextEditor ReDoS and regex error handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('escapes special regex characters and calculates counts correctly', async () => {
    render(
      <VFSProvider>
        <TextEditor />
      </VFSProvider>
    );

    // 1. Create a new file
    const newFileBtn = screen.getByText('New File');
    fireEvent.click(newFileBtn);

    // 2. Locate the text area and enter content with regex metacharacters
    const textareas = screen.getAllByRole('textbox');
    // The main code editor textarea
    const mainEditor = textareas[0];
    fireEvent.change(mainEditor, {
      target: { value: 'This text has [brackets], (parentheses), *stars*, and a backslash \\.' }
    });

    // 3. Open the Find panel
    const findBtn = screen.getByText('Find');
    fireEvent.click(findBtn);

    // 4. Type a special regex char into the find input
    const findInput = screen.getByPlaceholderText('Find...');
    
    // Test with '*'
    fireEvent.change(findInput, { target: { value: '*' } });
    let matchIndicator = await screen.findByText(/matches/);
    expect(matchIndicator.textContent).toBe('2 matches'); // there are two '*' in '*stars*'

    // Test with '['
    fireEvent.change(findInput, { target: { value: '[' } });
    matchIndicator = await screen.findByText(/matches/);
    expect(matchIndicator.textContent).toBe('1 matches');

    // Test with '('
    fireEvent.change(findInput, { target: { value: '(' } });
    matchIndicator = await screen.findByText(/matches/);
    expect(matchIndicator.textContent).toBe('1 matches');

    // Test with '\\'
    fireEvent.change(findInput, { target: { value: '\\' } });
    matchIndicator = await screen.findByText(/matches/);
    expect(matchIndicator.textContent).toBe('1 matches');
  });
});
