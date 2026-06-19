import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { VFSProvider, useFileSystem } from '../../hooks/useFileSystem';

describe('useFileSystem context state synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default file system and persist to localStorage', () => {
    const { result } = renderHook(() => useFileSystem(), {
      wrapper: VFSProvider,
    });

    expect(result.current.fs).toBeDefined();
    // Default nodes should exist, like root '/'
    const rootNode = Object.values(result.current.fs.nodes).find((n) => n.parentId === null);
    expect(rootNode).toBeDefined();
    expect(rootNode?.name).toBe('/');

    // Check localStorage persistence
    const saved = localStorage.getItem('ubuntuos_filesystem');
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!).nodes).toBeDefined();
  });

  it('should sync state mutations instantly across multiple hook consumers under the same provider', () => {
    const { result } = renderHook(
      () => {
        const consumerA = useFileSystem();
        const consumerB = useFileSystem();
        return { consumerA, consumerB };
      },
      { wrapper: VFSProvider }
    );

    const rootNode = Object.values(result.current.consumerA.fs.nodes).find((n) => n.parentId === null);
    expect(rootNode).toBeDefined();
    const rootId = rootNode!.id;

    // Mutate state using consumer A
    let newFileId: string | undefined;
    act(() => {
      newFileId = result.current.consumerA.createFile(rootId, 'test-sync.txt', 'hello sync');
    });

    expect(newFileId).toBeDefined();

    // Verify consumer B sees the changes instantly
    expect(result.current.consumerB.fs.nodes[newFileId!]).toBeDefined();
    expect(result.current.consumerB.fs.nodes[newFileId!].name).toBe('test-sync.txt');
    expect(result.current.consumerB.readFile(newFileId!)).toBe('hello sync');

    // Mutate state (write file) using consumer B
    act(() => {
      result.current.consumerB.writeFile(newFileId!, 'updated hello sync');
    });

    // Verify consumer A sees the changes instantly
    expect(result.current.consumerA.fs.nodes[newFileId!].content).toBe('updated hello sync');
    expect(result.current.consumerA.readFile(newFileId!)).toBe('updated hello sync');

    // Mutate state (delete file) using consumer A
    act(() => {
      result.current.consumerA.deleteNode(newFileId!);
    });

    // Verify consumer B sees the deletion instantly
    expect(result.current.consumerB.fs.nodes[newFileId!]).toBeUndefined();
    expect(result.current.consumerB.readFile(newFileId!)).toBeUndefined();
  });

  it('should save file system state to localStorage on modification', () => {
    const { result } = renderHook(() => useFileSystem(), {
      wrapper: VFSProvider,
    });

    const rootNode = Object.values(result.current.fs.nodes).find((n) => n.parentId === null);
    const rootId = rootNode!.id;

    // Reset localStorage setItem call counts before action
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    act(() => {
      result.current.createFile(rootId, 'storage-test.txt', 'testing localStorage');
    });

    // Expect setItem was called to save the new state
    expect(setItemSpy).toHaveBeenCalled();
    const saved = localStorage.getItem('ubuntuos_filesystem');
    expect(saved).toContain('storage-test.txt');
  });

  it('should prevent path traversal or invalid characters on createFile, createFolder, and renameNode', () => {
    const { result } = renderHook(() => useFileSystem(), {
      wrapper: VFSProvider,
    });

    const rootNode = Object.values(result.current.fs.nodes).find((n) => n.parentId === null);
    const rootId = rootNode!.id;

    // createFile invalid inputs
    expect(() => {
      act(() => {
        result.current.createFile(rootId, 'invalid/path.txt');
      });
    }).toThrow(/Invalid name/);

    expect(() => {
      act(() => {
        result.current.createFile(rootId, '..');
      });
    }).toThrow(/Invalid name/);

    expect(() => {
      act(() => {
        result.current.createFile(rootId, 'invalid\\path.txt');
      });
    }).toThrow(/Invalid name/);

    expect(() => {
      act(() => {
        result.current.createFile(rootId, '  ');
      });
    }).toThrow(/Invalid name/);

    // createFolder invalid inputs
    expect(() => {
      act(() => {
        result.current.createFolder(rootId, '../folder');
      });
    }).toThrow(/Invalid name/);

    expect(() => {
      act(() => {
        result.current.createFolder(rootId, '.');
      });
    }).toThrow(/Invalid name/);

    // renameNode invalid inputs
    let validFileId: string;
    act(() => {
      validFileId = result.current.createFile(rootId, 'valid.txt', 'valid content');
    });

    expect(() => {
      act(() => {
        result.current.renameNode(validFileId, 'invalid/rename.txt');
      });
    }).toThrow(/Invalid name/);
  });
});
