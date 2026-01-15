/**
 * Projects and Tasks API
 */

import type { ProjectItem, TaskHistoryItem } from "../api-types";

export const projectsApi = {
  list: async (): Promise<ProjectItem[]> => {
    // TODO: Replace with real API call
    // Return empty array for now
    return [];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create: async (_name: string): Promise<ProjectItem> => {
    // TODO: Replace with real API call
    throw new Error("Project API not implemented");
  },
};

export const tasksApi = {
  listHistory: async (): Promise<TaskHistoryItem[]> => {
    // TODO: Replace with real API call
    // Return empty array for now
    return [];
  },
};
