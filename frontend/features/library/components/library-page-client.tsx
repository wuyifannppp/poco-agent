"use client";

import * as React from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { LibraryHeader } from "@/features/library/components/library-header";
import { LibraryGrid } from "@/features/library/components/library-grid";

import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import { useProjectDeletion } from "@/features/projects/hooks/use-project-deletion";

import { SettingsDialog } from "@/features/settings/components/settings-dialog";

export function LibraryPageClient() {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { projects, addProject, updateProject, removeProject } = useProjects(
    {},
  );
  const { taskHistory, removeTask, moveTask } = useTaskHistory({});
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={undefined}
          onDeleteTask={removeTask}
          onCreateProject={addProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SidebarInset className="flex flex-col bg-muted/30">
          <LibraryHeader />

          <div className="flex flex-1 flex-col px-6 py-10">
            <div className="w-full max-w-6xl mx-auto">
              <LibraryGrid />
            </div>
          </div>
        </SidebarInset>

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </SidebarProvider>
  );
}
