import { z } from 'zod';
import { API_ROUTES } from './apiRoutes';
import { ApiClient } from '../lib/apiClient';
import { 
  ProjectSchema, 
  ProjectListResponseSchema,
  Project
} from '../schemas';

export const ProjectService = {
  async fetchProjects(): Promise<Project[]> {
    const response = await ApiClient.get(ProjectListResponseSchema, API_ROUTES.PROJECTS.LIST);
    return response.projects as unknown as Project[];
  },

  async getProjectById(id: string): Promise<Project> {
    return ApiClient.get(ProjectSchema, API_ROUTES.PROJECTS.DETAIL(id)) as unknown as Project;
  },

  async createProject(input: Partial<Project>): Promise<Project> {
    return ApiClient.post(ProjectSchema, API_ROUTES.PROJECTS.LIST, input) as unknown as Project;
  },

  async updateProject(id: string, input: Partial<Project>): Promise<Project> {
    return ApiClient.patch(ProjectSchema, API_ROUTES.PROJECTS.DETAIL(id), input) as unknown as Project;
  },

  async deleteProject(id: string): Promise<void> {
    // For delete, we might not expect a specific return body or it might be empty
    // Using a simple z.any() or specific schema if known
    await ApiClient.delete(z.any(), API_ROUTES.PROJECTS.DETAIL(id));
  },

  async getBudgetForecast(id: string): Promise<any> {
    return ApiClient.get(z.any(), API_ROUTES.V2.PROPHET.FORECAST(id));
  },
};
