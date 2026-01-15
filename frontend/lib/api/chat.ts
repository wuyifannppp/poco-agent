/**
 * Chat API - Session execution and messaging
 * Uses real API calls
 */

import { sessionApi, taskApi } from "../api-client";
import type {
  ExecutionSession,
  FileNode,
  ChatMessage,
  MessageBlock,
  SessionResponse,
  TaskEnqueueResponse,
} from "../api-types";

interface MessageContentBlock {
  _type: string;
  // ToolUseBlock fields
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  // ToolResultBlock fields
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  // TextBlock fields
  text?: string;
}

interface MessageContentShape {
  _type?: string;
  subtype?: string;
  content?: MessageContentBlock[];
  text?: string;
}

/**
 * Convert backend SessionResponse to frontend ExecutionSession format
 */
function toExecutionSession(
  session: SessionResponse,
  progress: number = 0,
): ExecutionSession {
  return {
    session_id: session.session_id,
    time: session.updated_at,
    status:
      session.status === "completed"
        ? "completed"
        : session.status === "failed"
          ? "failed"
          : session.status === "running"
            ? "running"
            : "accepted",
    progress,
    state_patch: session.state_patch ?? {},
    task_name: undefined,
    user_prompt: undefined,
  };
}

/**
 * Create a default empty execution session for error cases
 */
function createDefaultSession(sessionId: string): ExecutionSession {
  return {
    session_id: sessionId,
    time: new Date().toISOString(),
    status: "accepted",
    progress: 0,
    state_patch: {},
    task_name: undefined,
    user_prompt: undefined,
  };
}

export const chatApi = {
  /**
   * Get execution session state
   */
  getSession: async (
    sessionId: string,
    currentProgress: number = 0,
  ): Promise<ExecutionSession> => {
    try {
      const session = await sessionApi.get(sessionId);
      return toExecutionSession(session, currentProgress);
    } catch (error) {
      console.error("[Chat API] Failed to get session:", error);
      return createDefaultSession(sessionId);
    }
  },

  /**
   * Create new execution session with a prompt
   */
  createSession: async (
    prompt: string,
    userId: string = "default-user",
  ): Promise<TaskEnqueueResponse> => {
    return taskApi.enqueue({
      user_id: userId,
      prompt,
      schedule_mode: "immediate",
    });
  },

  /**
   * Send message to existing session (continues the conversation)
   */
  sendMessage: async (
    sessionId: string,
    content: string,
    userId: string = "default-user",
  ): Promise<TaskEnqueueResponse> => {
    return taskApi.enqueue({
      user_id: userId,
      prompt: content,
      session_id: sessionId,
      schedule_mode: "immediate",
    });
  },

  /**
   * Get messages for a session
   */
  /**
   * Get messages for a session
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const messages = await sessionApi.getMessages(sessionId);
      const processedMessages: ChatMessage[] = [];

      let currentAssistantMessage: ChatMessage | null = null;

      for (const msg of messages) {
        // Skip system init messages
        const contentObj = msg.content as MessageContentShape;
        if (
          contentObj._type === "SystemMessage" &&
          contentObj.subtype === "init"
        ) {
          continue;
        }

        // Handle Tool Use (Assistant)
        if (msg.role === "assistant" && contentObj.content) {
          const blocks = contentObj.content;
          const toolUseBlocks = blocks.filter(
            (b) => b._type === "ToolUseBlock",
          );

          if (toolUseBlocks.length > 0) {
            if (!currentAssistantMessage) {
              currentAssistantMessage = {
                id: msg.id.toString(),
                role: "assistant",
                content: [],
                status: "completed",
                timestamp: msg.created_at,
              };
              processedMessages.push(currentAssistantMessage);
            }

            // Append blocks
            const existingBlocks =
              currentAssistantMessage.content as MessageBlock[];

            // Map API tool blocks to our UI ToolUseBlock
            const uiToolBlocks = toolUseBlocks.map((b) => ({
              _type: "ToolUseBlock" as const,
              id: b.id || "",
              name: b.name || "",
              input: b.input || {},
            }));

            currentAssistantMessage.content = [
              ...existingBlocks,
              ...uiToolBlocks,
            ];
            continue;
          }
        }

        // Handle Tool Result (User role but effectively part of assistant's thought process)
        if (msg.role === "user" && contentObj.content) {
          const blocks = contentObj.content;
          const toolResultBlocks = blocks.filter(
            (b) => b._type === "ToolResultBlock",
          );

          if (toolResultBlocks.length > 0) {
            if (currentAssistantMessage) {
              // Append results to the assistant message
              const uiResultBlocks = toolResultBlocks.map((b) => ({
                _type: "ToolResultBlock" as const,
                tool_use_id: b.tool_use_id || "",
                content:
                  typeof b.content === "string"
                    ? b.content
                    : JSON.stringify(b.content),
                is_error: !!b.is_error,
              }));
              const existingBlocks =
                currentAssistantMessage.content as MessageBlock[];
              currentAssistantMessage.content = [
                ...existingBlocks,
                ...uiResultBlocks,
              ];
              continue;
            }
          }
        }

        // Handle generic text messages (Assistant or User)
        let textContent = "";

        // Extract text
        // Extract text
        if (contentObj.text) {
          textContent = String(contentObj.text);
        } else if (contentObj.content && Array.isArray(contentObj.content)) {
          // Try to find TextBlock
          const textBlock = contentObj.content.find(
            (b) => b._type === "TextBlock",
          );
          if (textBlock) textContent = textBlock.text || "";
        }

        // Fallback to text_preview if no content found
        if (!textContent && msg.text_preview) {
          textContent = msg.text_preview;
        }

        if (textContent) {
          // If it's a user message, break the assistant chain
          if (msg.role === "user") {
            currentAssistantMessage = null;
            processedMessages.push({
              id: msg.id.toString(),
              role: "user",
              content: textContent,
              status: "completed",
              timestamp: msg.created_at,
            });
          } else {
            // Assistant text message
            // If we have an active chain, append it as a TextBlock to that chain
            if (currentAssistantMessage) {
              const existingBlocks =
                currentAssistantMessage.content as MessageBlock[];
              existingBlocks.push({
                _type: "TextBlock",
                text: textContent,
              });
            } else {
              // New standalone assistant message
              processedMessages.push({
                id: msg.id.toString(),
                role: "assistant",
                content: textContent, // Simplified for pure text
                status: "completed",
                timestamp: msg.created_at,
              });
            }
          }
        }
      }

      return processedMessages;
    } catch (error) {
      console.error("[Chat API] Failed to get messages:", error);
      return [];
    }
  },

  /**
   * Get workspace files for a session
   */
  getFiles: async (sessionId?: string): Promise<FileNode[]> => {
    if (!sessionId) {
      return [];
    }

    try {
      // Try to get files from dedicated workspace/files endpoint first
      let rawFiles: FileNode[];
      try {
        rawFiles = await sessionApi.getWorkspaceFiles(sessionId);
      } catch (error) {
        // Fallback: extract files from session state_patch.workspace_state.file_changes
        console.log(
          "[Chat API] Workspace files endpoint failed, using session data fallback",
        );
        rawFiles = await sessionApi.getWorkspaceFilesFromSession(sessionId);
      }

      // Helper to valid URL and children recursively
      const fixUrls = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => ({
          ...node,
          url: sessionApi.getWorkspaceFileUrl(sessionId, node.path),
          children: node.children ? fixUrls(node.children) : node.children,
        }));
      };

      /**
       * Robustly build file tree from potentially flat list
       */
      const buildFileTree = (nodes: FileNode[]): FileNode[] => {
        const nodeMap = new Map<string, FileNode>();
        const rootNodes: FileNode[] = [];

        // 1. First pass: Register all existing nodes
        // flatten in case it's a mix or already tree-like but broken
        const flatten = (list: FileNode[]): FileNode[] => {
          let result: FileNode[] = [];
          for (const item of list) {
            result.push(item);
            if (item.children) {
              result = result.concat(flatten(item.children));
            }
          }
          return result;
        };

        const allNodes = flatten(nodes);

        // Sort by path length to process parents before children if possible,
        // though map lookup handles order independence.
        // Actually, we just need to ensure every path is in the map.
        allNodes.forEach((node) => {
          // Create a clean copy without children to rebuild hierarchy
          nodeMap.set(node.path, { ...node, children: [] });
        });

        // 2. Second pass: Build hierarchy
        // We iterate through all known paths.
        // If a node's parent doesn't exist, we create it (implicit folder).
        const processedPaths = new Set<string>();

        // Sort paths to ensure we handle parents first, or at least consistent order
        const sortedPaths = Array.from(nodeMap.keys()).sort();

        sortedPaths.forEach((path) => {
          if (processedPaths.has(path)) return;

          const parts = path.split("/");
          let currentPath = "";

          parts.forEach((part, index) => {
            const parentPath = currentPath; // previous iteration's path
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (processedPaths.has(currentPath)) return;

            let node = nodeMap.get(currentPath);

            // If node doesn't exist, create implicit folder
            // BUT: if this is the final part of the path, check if original node was a file
            if (!node) {
              const isLastPart = index === parts.length - 1;
              const originalNode = nodeMap.get(path);

              node = {
                id: currentPath,
                name: part,
                path: currentPath,
                // If it's the last part and we have the original node, use its type
                // Otherwise, it's an intermediate directory
                type: isLastPart && originalNode ? originalNode.type : "folder",
                children: [],
              };
              nodeMap.set(currentPath, node);
            }

            // Link to parent
            if (parentPath) {
              const parent = nodeMap.get(parentPath);
              if (parent) {
                if (!parent.children) parent.children = [];
                // Avoid duplicates
                if (!parent.children.find((c) => c.path === node!.path)) {
                  parent.children.push(node);
                }
              }
            } else {
              // It's a root node
              if (!rootNodes.find((n) => n.path === node!.path)) {
                rootNodes.push(node);
              }
            }

            processedPaths.add(currentPath);
          });
        });

        // 3. Recursive Sort: Folders top, then Name ASC
        const sortTree = (list: FileNode[]) => {
          list.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          list.forEach((node) => {
            if (node.children) sortTree(node.children);
          });
        };

        sortTree(rootNodes);
        return rootNodes;
      };

      /**
       * Remove empty folders recursively
       */
      const removeEmptyFolders = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .map((node) => {
            if (node.type === "folder" && node.children) {
              // Recursively clean children first
              node.children = removeEmptyFolders(node.children);
              // If folder has no children after cleaning, filter it out
              if (node.children.length === 0) {
                return null;
              }
            }
            return node;
          })
          .filter((node): node is FileNode => node !== null);
      };

      // If the backend returns a flat list (which seems to be the case causing issues),
      // we need to rebuild the tree.
      // Even if it returns a tree, rebuilding ensures consistency.
      let tree = buildFileTree(rawFiles);

      // Remove any empty folders that were created during tree building
      tree = removeEmptyFolders(tree);

      return fixUrls(tree);
    } catch (error) {
      console.error("[Chat API] Failed to get files:", error);
      return [];
    }
  },

  /**
   * Get file download/preview URL
   */
  getFileUrl: (sessionId: string, filePath: string): string => {
    return sessionApi.getWorkspaceFileUrl(sessionId, filePath);
  },
};
