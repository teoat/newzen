import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { ProjectService } from '../ProjectService';
import { renderWithProviders, mockProject } from '../../test/utils';
import { authenticatedFetch } from '../../lib/api';

// Mock the API utility
vi.mock('../../lib/api', () => ({
  authenticatedFetch: vi.fn(),
  getCookie: vi.fn(() => 'mock-token'),
}));

// Type the mocked function
const mockedFetch = authenticatedFetch as MockedFunction<typeof authenticatedFetch>;

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        mockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Project 1' }),
        mockProject({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Project 2' }),
      ];

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response);

      const result = await ProjectService.fetchProjects();

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/project', expect.anything());
      expect(result).toEqual(mockProjects);
    });

    it('should handle API errors', async () => {
      mockedFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(ProjectService.fetchProjects()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Network error'));

      await expect(ProjectService.fetchProjects()).rejects.toThrow('Network error');
    });
  });

  describe('getProjectById', () => {
    it('should fetch a single project by ID', async () => {
      const projectId = '550e8400-e29b-41d4-a716-446655440001';
      const project = mockProject({ id: projectId, name: 'Test Project' });

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => project,
      } as Response);

      const result = await ProjectService.getProjectById(projectId);

      expect(mockedFetch).toHaveBeenCalledWith(`/api/v1/project/${projectId}`, expect.anything());
      expect(result).toEqual(project);
    });

    it('should handle 404 errors', async () => {
      mockedFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(ProjectService.getProjectById('nonexistent')).rejects.toThrow();
    });
  });
});
