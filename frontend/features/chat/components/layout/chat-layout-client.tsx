"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import { useProjectDeletion } from "@/features/projects/hooks/use-project-deletion";
import { TaskHistoryProvider } from "@/features/projects/contexts/task-history-context";

interface ChatLayoutClientProps {
  children: React.ReactNode;
}

export function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { projects, addProject, updateProject, removeProject } = useProjects(
    {},
  );
  const { taskHistory, removeTask, moveTask, refreshTasks } = useTaskHistory(
    {},
  );
  const deleteProject = useProjectDeletion({
    taskHistory,
    moveTask,
    removeProject,
  });

  const handleRenameProject = React.useCallback(
    (projectId: string, newName: string) => {
      updateProject(projectId, { name: newName });
    },
    [updateProject],
  );

  const handleDeleteProject = React.useCallback(
    async (projectId: string) => {
      await deleteProject(projectId);
    },
    [deleteProject],
  );

  return (
    <TaskHistoryProvider value={{ refreshTasks }}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-svh w-full overflow-hidden bg-background">
          <AppSidebar
            projects={projects}
            taskHistory={taskHistory}
            onNewTask={() => router.push("/")}
            onDeleteTask={removeTask}
            onCreateProject={addProject}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
            onMoveTaskToProject={moveTask}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <SidebarInset className="flex flex-col bg-muted/30">
            {children}
          </SidebarInset>
          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />
        </div>
      </SidebarProvider>
    </TaskHistoryProvider>
  );
}
