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
      const mockProjectsInput = [
        mockProject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Project 1' }),
        mockProject({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Project 2' }),
      ];

      const expectedProjects = mockProjectsInput.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        contract_value: p.contract_value,
        realized_spend: p.realized_spend,
        status: p.status,
        created_at: p.created_at,
      }));

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjectsInput, total: 2 }),
      } as Response);

      const result = await ProjectService.fetchProjects();

      expect(mockedFetch).toHaveBeenCalledWith('/api/v1/project', expect.anything());
      expect(result).toEqual(expectedProjects);
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
      const projectInput = mockProject({ id: projectId, name: 'Test Project' });
      const expectedProject = {
        id: projectInput.id,
        name: projectInput.name,
        description: projectInput.description,
        contract_value: projectInput.contract_value,
        realized_spend: projectInput.realized_spend,
        status: projectInput.status,
        created_at: projectInput.created_at,
      };

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => projectInput,
      } as Response);

      const result = await ProjectService.getProjectById(projectId);

      expect(mockedFetch).toHaveBeenCalledWith(`/api/v1/project/${projectId}`, expect.anything());
      expect(result).toEqual(expectedProject);
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
