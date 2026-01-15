/**
 * API Client for backend communication
 * Unified API layer based on OpenAPI specification
 */

import type {
  ApiResponse,
  SessionResponse,
  SessionCreateRequest,
  SessionUpdateRequest,
  MessageResponse,
  ToolExecutionResponse,
  UsageResponse,
  TaskEnqueueRequest,
  TaskEnqueueResponse,
  RunResponse,
  FileNode,
} from "./api-types";

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Generic fetch wrapper with error handling and response unwrapping
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  const method = options?.method || "GET";

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // console.log(`[API] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (result.data) {
      // 使用彩色日志增强可读性
      // 方法名和 endpoint 用蓝色，数据用绿色
      console.log(
        `%c[API]%c ${method} ${endpoint}`,
        "color: #1976d2; font-weight: bold;",
        "color: inherit;",
      );
      console.log(
        "%c[API] Response Data:",
        "color: #43a047; font-weight: bold;",
        result.data,
      );
    }

    if (result.code !== 200 && result.code !== 0) {
      throw new Error(result.message || "API request failed");
    }

    return result.data as T;
  } catch (error) {
    console.error(`[API] Call failed: ${endpoint}`, error);
    throw error;
  }
}

// ============ Session API ============

export const sessionApi = {
  /**
   * List all sessions
   * GET /api/v1/sessions
   */
  list: async (params?: {
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<SessionResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.user_id) searchParams.append("user_id", params.user_id);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<SessionResponse[]>(`/sessions${query ? `?${query}` : ""}`);
  },

  /**
   * Get a single session by ID
   * GET /api/v1/sessions/{session_id}
   */
  get: async (sessionId: string): Promise<SessionResponse> => {
    return fetchApi<SessionResponse>(`/sessions/${sessionId}`);
  },

  /**
   * Create a new session
   * POST /api/v1/sessions
   */
  create: async (request: SessionCreateRequest): Promise<SessionResponse> => {
    return fetchApi<SessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Update a session
   * PATCH /api/v1/sessions/{session_id}
   */
  update: async (
    sessionId: string,
    request: SessionUpdateRequest,
  ): Promise<SessionResponse> => {
    return fetchApi<SessionResponse>(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
  },

  /**
   * Get messages for a session
   * GET /api/v1/sessions/{session_id}/messages
   */
  getMessages: async (sessionId: string): Promise<MessageResponse[]> => {
    return fetchApi<MessageResponse[]>(`/sessions/${sessionId}/messages`);
  },

  /**
   * Get tool executions for a session
   * GET /api/v1/sessions/{session_id}/tool-executions
   */
  getToolExecutions: async (
    sessionId: string,
  ): Promise<ToolExecutionResponse[]> => {
    return fetchApi<ToolExecutionResponse[]>(
      `/sessions/${sessionId}/tool-executions`,
    );
  },

  /**
   * Get usage statistics for a session
   * GET /api/v1/sessions/{session_id}/usage
   */
  getUsage: async (sessionId: string): Promise<UsageResponse> => {
    return fetchApi<UsageResponse>(`/sessions/${sessionId}/usage`);
  },

  /**
   * Get workspace files for a session
   * GET /api/v1/sessions/{session_id}/workspace/files
   */
  getWorkspaceFiles: async (sessionId: string): Promise<FileNode[]> => {
    return fetchApi<FileNode[]>(`/sessions/${sessionId}/workspace/files`);
  },

  /**
   * Get workspace files from session state_patch
   * Alternative method that extracts file_changes from session data
   */
  getWorkspaceFilesFromSession: async (
    sessionId: string,
  ): Promise<FileNode[]> => {
    try {
      const session = await sessionApi.get(sessionId);
      const fileChanges =
        session.state_patch?.workspace_state?.file_changes || [];

      // Convert FileChange[] to FileNode[]
      return fileChanges.map((change) => ({
        id: change.path,
        name: change.path.split("/").pop() || change.path,
        path: change.path,
        type: "file", // All items in file_changes are files
        url: sessionApi.getWorkspaceFileUrl(sessionId, change.path),
      }));
    } catch (error) {
      console.error(
        "[Session API] Failed to get workspace files from session:",
        error,
      );
      return [];
    }
  },

  /**
   * Get workspace file URL for preview/download
   * GET /api/v1/sessions/{session_id}/workspace/file?path={path}
   * Returns redirect URL
   */
  getWorkspaceFileUrl: (sessionId: string, filePath: string): string => {
    return `${API_BASE_URL}/api/v1/sessions/${sessionId}/workspace/file?path=${encodeURIComponent(filePath)}`;
  },
};

// ============ Task API ============

export const taskApi = {
  /**
   * Enqueue a new task (agent run)
   * POST /api/v1/tasks
   */
  enqueue: async (
    request: TaskEnqueueRequest,
  ): Promise<TaskEnqueueResponse> => {
    return fetchApi<TaskEnqueueResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

// ============ Run API ============

export const runApi = {
  /**
   * Get run details
   * GET /api/v1/runs/{run_id}
   */
  get: async (runId: string): Promise<RunResponse> => {
    return fetchApi<RunResponse>(`/runs/${runId}`);
  },

  /**
   * List runs for a session
   * GET /api/v1/runs/session/{session_id}
   */
  listBySession: async (
    sessionId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<RunResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<RunResponse[]>(
      `/runs/session/${sessionId}${query ? `?${query}` : ""}`,
    );
  },
};

// ============ Message API ============

export const messageApi = {
  /**
   * Get a message by ID
   * GET /api/v1/messages/{message_id}
   */
  get: async (messageId: number): Promise<MessageResponse> => {
    return fetchApi<MessageResponse>(`/messages/${messageId}`);
  },
};

// ============ Tool Execution API ============

export const toolExecutionApi = {
  /**
   * Get a tool execution by ID
   * GET /api/v1/tool-executions/{execution_id}
   */
  get: async (executionId: string): Promise<ToolExecutionResponse> => {
    return fetchApi<ToolExecutionResponse>(`/tool-executions/${executionId}`);
  },
};

// ============ Schedule API ============

export const scheduleApi = {
  /**
   * Get schedules (proxy from Executor Manager)
   * GET /api/v1/schedules
   */
  list: async (): Promise<Record<string, unknown>> => {
    return fetchApi<Record<string, unknown>>("/schedules");
  },
};

// ============ Health API ============

export const healthApi = {
  /**
   * Check API health
   * GET /api/v1/health
   */
  check: async (): Promise<unknown> => {
    return fetchApi<unknown>("/health");
  },
};
