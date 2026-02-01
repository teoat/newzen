import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProject } from '../useProject';

describe('useProject Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useProject());

    expect(result.current.activeProjectId).toBeNull();
    expect(result.current.activeProject).toBeNull();
    expect(result.current.projects).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set active project', () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setActiveProject('project-1');
    });

    expect(result.current.activeProjectId).toBe('project-1');
  });

  it('should clear active project', () => {
    const { result } = renderHook(() => useProject());

    act(() => {
      result.current.setActiveProject('project-1');
    });

    expect(result.current.activeProjectId).toBe('project-1');

    act(() => {
      result.current.setActiveProject(null);
    });

    expect(result.current.activeProjectId).toBeNull();
    expect(result.current.activeProject).toBeNull();
  });
});
