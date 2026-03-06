import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProject } from '../../store/useProject';
import { ProjectService } from '../../services/ProjectService';
import type { Project } from '../../schemas';

// Mock the ProjectService
vi.mock('../../services/ProjectService', () => ({
  ProjectService: {
    fetchProjects: vi.fn(),
    getBudgetForecast: vi.fn().mockResolvedValue({ status: 'healthy' }),
  },
}));

// ... (zustand mock remains)

// Helper to create valid Project test data
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Project',
  contractor_name: 'Test Contractor',
  contract_value: 1000000,
  realized_spend: 500000,
  status: 'active',
  start_date: new Date().toISOString(),
  ...overrides,
});

describe('useProject Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    act(() => {
      useProject.getState().purgeState();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProject());

      expect(result.current.activeProjectId).toBeNull();
      expect(result.current.activeProject).toBeNull();
      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setActiveProject', () => {
    it('should set active project by ID', () => {
      const { result } = renderHook(() => useProject());

      // First set some projects
      const mockProjects = [
        createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Project 1' }),
        createMockProject({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Project 2' }),
      ];

      act(() => {
        // Manually set projects for testing
        useProject.setState({ projects: mockProjects });
      });

      act(() => {
        result.current.setActiveProject('550e8400-e29b-41d4-a716-446655440001');
      });

      expect(result.current.activeProjectId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.current.activeProject).toEqual(mockProjects[0]);
    });

    it('should clear active project when null is passed', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.setActiveProject('proj-1');
      });

      act(() => {
        result.current.setActiveProject(null);
      });

      expect(result.current.activeProjectId).toBeNull();
      expect(result.current.activeProject).toBeNull();
    });

    it('should handle non-existent project ID gracefully', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.setActiveProject('non-existent');
      });

      expect(result.current.activeProjectId).toBe('non-existent');
      expect(result.current.activeProject).toBeNull();
    });
  });

  describe('fetchProjects', () => {
    it('should fetch projects and update state', async () => {
      const mockProjects = [
        createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Project 1', description: 'Test 1' }),
        createMockProject({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Project 2', description: 'Test 2' }),
      ];

      vi.mocked(ProjectService.fetchProjects).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state during fetch', async () => {
      let resolveFetch: (val: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(ProjectService.fetchProjects).mockReturnValue(fetchPromise as any);

      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.fetchProjects();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFetch!([]);
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(ProjectService.fetchProjects).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch projects', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should refresh active project details after fetch', async () => {
      const initialProject = createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Old Name' });
      const updatedProjects = [
        createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'New Name', description: 'Updated' }),
      ];

      const { result } = renderHook(() => useProject());

      // Set initial state
      act(() => {
        useProject.setState({
          activeProjectId: '550e8400-e29b-41d4-a716-446655440001',
          activeProject: initialProject,
        });
      });

      vi.mocked(ProjectService.fetchProjects).mockResolvedValue(updatedProjects);

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.activeProject).toEqual(updatedProjects[0]);
    });
  });

  describe('purgeState', () => {
    it('should clear all state and storage', () => {
      const { result } = renderHook(() => useProject());

      // Set some state first
      act(() => {
        useProject.setState({
          activeProjectId: '550e8400-e29b-41d4-a716-446655440001',
          activeProject: createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Test' }),
          projects: [createMockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Test' })],
        });
      });

      // Mock localStorage
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

      act(() => {
        result.current.purgeState();
      });

      expect(result.current.activeProjectId).toBeNull();
      expect(result.current.activeProject).toBeNull();
      expect(result.current.projects).toEqual([]);
      expect(removeItemSpy).toHaveBeenCalledWith('zenith-project-storage');

      removeItemSpy.mockRestore();
    });
  });
});
