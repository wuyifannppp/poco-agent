import { createContext, useContext } from "react";

interface TaskHistoryContextValue {
  refreshTasks: () => Promise<void>;
}

const TaskHistoryContext = createContext<TaskHistoryContextValue | null>(null);

export const TaskHistoryProvider = TaskHistoryContext.Provider;

export function useTaskHistoryContext() {
  const context = useContext(TaskHistoryContext);
  if (!context) {
    throw new Error(
      "useTaskHistoryContext must be used within TaskHistoryProvider",
    );
  }
  return context;
}
