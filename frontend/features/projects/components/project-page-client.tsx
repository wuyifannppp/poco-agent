"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useAutosizeTextarea } from "@/features/home/hooks/use-autosize-textarea";
import { useTaskHistory } from "@/features/projects/hooks/use-task-history";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useProjectDeletion } from "@/features/projects/hooks/use-project-deletion";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import type { InputFile } from "@/features/chat/types/api/session";

import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { KeyboardHints } from "@/features/home/components/keyboard-hints";
import { QuickActions } from "@/features/home/components/quick-actions";
import { TaskComposer } from "@/features/home/components/task-composer";

interface ProjectPageClientProps {
  projectId: string;
}

export function ProjectPageClient({ projectId }: ProjectPageClientProps) {
  const { t } = useT("translation");
  const router = useRouter();

  const { projects, addProject, updateProject, removeProject } = useProjects(
    {},
  );
  const currentProject = React.useMemo(
    () => projects.find((p) => p.id === projectId) || projects[0],
    [projects, projectId],
  );

  const { taskHistory, addTask, removeTask, moveTask } = useTaskHistory({});
  const deleteProject = useProjectDeletion({
    taskHistory,
    moveTask,
    removeProject,
  });

  const [inputValue, setInputValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attachments, setAttachments] = React.useState<InputFile[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);

  const focusComposer = React.useCallback(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const handleNewTask = React.useCallback(() => {
    router.push(`/chat/new?projectId=${projectId}`);
  }, [router, projectId]);

  const handleSendTask = React.useCallback(async () => {
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const session = await createSessionAction({
        prompt: inputValue,
        projectId,
        config: attachments.length
          ? {
              input_files: attachments,
            }
          : undefined,
      });

      localStorage.setItem(`session_prompt_${session.sessionId}`, inputValue);

      addTask(inputValue, {
        id: session.sessionId,
        timestamp: new Date().toISOString(),
        status: "running",
        projectId,
      });

      setInputValue("");
      setAttachments([]);

      router.push(`/chat/${session.sessionId}`);
    } catch (error) {
      console.error("[Project] Failed to create session", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [addTask, attachments, inputValue, isSubmitting, projectId, router]);

  const handleQuickActionPick = React.useCallback(
    (prompt: string) => {
      setInputValue(prompt);
      focusComposer();
    },
    [focusComposer],
  );

  const handleRenameProject = React.useCallback(
    (targetProjectId: string, newName: string) => {
      updateProject(targetProjectId, { name: newName });
    },
    [updateProject],
  );

  const handleDeleteProject = React.useCallback(
    async (targetProjectId: string) => {
      await deleteProject(targetProjectId);
      if (targetProjectId === projectId) {
        router.push("/home");
      }
    },
    [deleteProject, projectId, router],
  );

  const handleRenameTask = React.useCallback(
    (taskId: string, newName: string) => {
      console.log("Rename task:", taskId, "to:", newName);
    },
    [],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={handleNewTask}
          onDeleteTask={removeTask}
          onRenameTask={handleRenameTask}
          onMoveTaskToProject={moveTask}
          onCreateProject={addProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
        />

        <SidebarInset className="flex flex-col bg-muted/30">
          <ProjectHeader
            project={currentProject}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
          />

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-medium tracking-tight text-foreground">
                  {currentProject?.name || t("hero.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("project.subtitle", {
                    count: taskHistory.filter(
                      (task) => task.projectId === projectId,
                    ).length,
                  })}
                </p>
              </div>

              <TaskComposer
                textareaRef={textareaRef}
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendTask}
                isSubmitting={isSubmitting}
                onAttachmentsChange={setAttachments}
              />

              <QuickActions onPick={handleQuickActionPick} />
              <KeyboardHints />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
