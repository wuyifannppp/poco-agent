"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { FileNode } from "@/features/chat/types";
import {
  File,
  Download,
  ExternalLink,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import type { DocViewerProps } from "react-doc-viewer";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import jsonLang from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import scss from "react-syntax-highlighter/dist/esm/languages/prism/scss";
import less from "react-syntax-highlighter/dist/esm/languages/prism/less";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import cLang from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import objectivec from "react-syntax-highlighter/dist/esm/languages/prism/objectivec";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import powershell from "react-syntax-highlighter/dist/esm/languages/prism/powershell";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import ini from "react-syntax-highlighter/dist/esm/languages/prism/ini";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import { cn } from "@/lib/utils";

/** Register Prism languages exactly once per bundle */
const registerSyntaxLanguages = (() => {
  let registered = false;
  return () => {
    if (registered) return;
    const register = (name: string, language: unknown) => {
      SyntaxHighlighter.registerLanguage(name, language);
    };

    register("javascript", javascript);
    register("typescript", typescript);
    register("tsx", tsx);
    register("jsx", jsx);
    register("python", python);
    register("json", jsonLang);
    register("markdown", markdown);
    register("markup", markup);
    register("bash", bash);
    register("yaml", yaml);
    register("css", css);
    register("scss", scss);
    register("less", less);
    register("go", go);
    register("java", java);
    register("php", php);
    register("ruby", ruby);
    register("swift", swift);
    register("kotlin", kotlin);
    register("csharp", csharp);
    register("c", cLang);
    register("cpp", cpp);
    register("objectivec", objectivec);
    register("sql", sql);
    register("powershell", powershell);
    register("docker", docker);
    register("ini", ini);
    register("rust", rust);
    registered = true;
  };
})();

registerSyntaxLanguages();

/** Dynamic import prevents SSR issues and keeps bundle small */
const DocViewer = dynamic<DocViewerProps>(
  () => import("./doc-viewer-client").then((m) => m.DocViewerClient),
  {
    ssr: false,
    loading: () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { t } = useT("translation");
      return (
        <div className="h-full flex items-center justify-center p-8 text-muted-foreground animate-pulse text-sm">
          {t("artifacts.viewer.loadingEngine")}
        </div>
      );
    },
  },
);

const DOC_VIEWER_TYPE_MAP: Record<string, string> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "pptx",
  txt: "txt",
  ts: "txt",
  tsx: "txt",
  js: "txt",
  jsx: "txt",
  py: "txt",
  json: "txt",
  htm: "html",
  html: "html",
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  bmp: "bmp",
};

const TEXT_LANGUAGE_MAP: Record<string, string> = {
  txt: "text",
  log: "text",
  md: "markdown",
  markdown: "markdown",
  mdown: "markdown",
  mdx: "markdown",
  py: "python",
  pyw: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  jsonc: "json",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  css: "css",
  scss: "scss",
  less: "less",
  html: "markup",
  htm: "markup",
  go: "go",
  java: "java",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kotlin: "kotlin",
  cs: "csharp",
  csharp: "csharp",
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  mm: "objectivec",
  m: "objectivec",
  sql: "sql",
  ps1: "powershell",
  dockerfile: "docker",
  env: "ini",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  rs: "rust",
};

const MIME_LANGUAGE_RULES: Array<{ test: RegExp; language: string }> = [
  { test: /^application\/json/i, language: "json" },
  { test: /javascript/i, language: "javascript" },
  { test: /typescript/i, language: "typescript" },
  { test: /python/i, language: "python" },
  { test: /markdown/i, language: "markdown" },
  { test: /^text\/plain/i, language: "text" },
  { test: /(shell|bash|zsh)/i, language: "bash" },
  { test: /(yaml|yml)/i, language: "yaml" },
  { test: /(html|xml)/i, language: "markup" },
  { test: /css/i, language: "css" },
  { test: /java/i, language: "java" },
  { test: /c\+\+/i, language: "cpp" },
  { test: /\bc\b/i, language: "c" },
  { test: /go/i, language: "go" },
  { test: /rust/i, language: "rust" },
  { test: /sql/i, language: "sql" },
];

const VIEW_CLASSNAME =
  "h-full w-full animate-in fade-in duration-300 [--tw-enter-opacity:1] [--tw-enter-scale:1] [--tw-enter-translate-x:0] [--tw-enter-translate-y:0] overflow-hidden";

const DEFAULT_TEXT_LANGUAGE = "text";
const NO_SOURCE_ERROR = "NO_SOURCE";

type FileContentState =
  | { status: "idle" | "loading" }
  | { status: "success"; content: string }
  | { status: "error"; code: "NO_SOURCE" | "FETCH_ERROR"; message?: string };

interface UseFileTextContentParams {
  file?: FileNode;
  sessionId?: string;
  fallbackUrl?: string;
}

const useFileTextContent = ({
  file,
  sessionId,
  fallbackUrl,
}: UseFileTextContentParams) => {
  const [state, setState] = React.useState<FileContentState>({
    status: "idle",
  });
  const [refreshKey, setRefreshKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    if (!file) {
      setState({ status: "idle" });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      setState({ status: "loading" });
      try {
        let text: string | undefined;
        const urlToFetch = fallbackUrl || file?.url;

        if (urlToFetch) {
          const response = await fetch(urlToFetch, {
            signal: controller.signal,
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          text = await response.text();
        } else {
          throw new Error(NO_SOURCE_ERROR);
        }

        if (!isMounted) return;
        setState({ status: "success", content: text ?? "" });
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;
        if (error instanceof Error && error.message === NO_SOURCE_ERROR) {
          setState({ status: "error", code: "NO_SOURCE" });
          return;
        }
        setState({
          status: "error",
          code: "FETCH_ERROR",
          message:
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : undefined,
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [file, sessionId, fallbackUrl, refreshKey]);

  return { state, refetch } as const;
};

const ensureAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  try {
    if (typeof window !== "undefined") {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  } catch (error) {
    console.warn("[DocumentViewer] Failed to resolve URL", error);
    return url;
  }
};

const extractExtension = (file?: FileNode) => {
  if (!file) return "";
  const sources = [file.name, file.path, file.url].filter(Boolean) as string[];
  for (const source of sources) {
    const sanitized = source.split(/[?#]/)[0];
    const parts = sanitized.split(".");
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase();
      if (ext) return ext;
    }
  }
  return "";
};

const getTextLanguage = (ext: string, mime?: string | null) => {
  if (ext && TEXT_LANGUAGE_MAP[ext]) return TEXT_LANGUAGE_MAP[ext];
  if (mime) {
    const match = MIME_LANGUAGE_RULES.find(({ test }) => test.test(mime));
    if (match) return match.language;
    if (mime.startsWith("text/")) return DEFAULT_TEXT_LANGUAGE;
  }
  return undefined;
};

interface TextDocumentViewerProps {
  file: FileNode;
  language?: string;
  sessionId?: string;
  resolvedUrl?: string;
}

const TextDocumentViewer = ({
  file,
  language = DEFAULT_TEXT_LANGUAGE,
  sessionId,
  resolvedUrl,
}: TextDocumentViewerProps) => {
  const { t } = useT("translation");
  const { state, refetch } = useFileTextContent({
    file,
    sessionId,
    fallbackUrl: resolvedUrl,
  });
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const syntaxLanguage =
    language === DEFAULT_TEXT_LANGUAGE ? undefined : language;

  const handleCopy = React.useCallback(async () => {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (error) {
      console.error("[DocumentViewer] Copy failed", error);
    }
  }, [state]);

  const handleOpen = React.useCallback(() => {
    if (resolvedUrl) window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  }, [resolvedUrl]);

  const handleDownload = React.useCallback(() => {
    if (!resolvedUrl) return;
    const link = document.createElement("a");
    link.href = resolvedUrl;
    link.download = file.name || "document";
    link.click();
  }, [file.name, resolvedUrl]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div
        className={cn(
          VIEW_CLASSNAME,
          "flex items-center justify-center text-sm text-muted-foreground",
        )}
      >
        <Loader2 className="size-4 mr-2 animate-spin" />
        {t("artifacts.viewer.loadingDoc")}
      </div>
    );
  }

  if (state.status === "error") {
    const isSourceError = state.code === "NO_SOURCE";
    return (
      <div className={VIEW_CLASSNAME}>
        <StatusLayout
          icon={File}
          title={
            isSourceError
              ? t("artifacts.viewer.notSupported")
              : t("artifacts.viewer.fetchError")
          }
          desc={isSourceError ? file.name : state.message}
          action={
            !isSourceError && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={refetch}
              >
                {t("artifacts.viewer.retry")}
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        VIEW_CLASSNAME,
        "bg-card border rounded-xl shadow-sm flex flex-col",
      )}
    >
      <div className="border-b px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground truncate">
            {file.name || file.path}
          </span>
          <span className="tracking-wide uppercase text-[11px]">
            {language}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCopy}
            disabled={state.status !== "success"}
          >
            {copyState === "copied" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          {resolvedUrl && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleOpen}
              >
                <ExternalLink className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/20">
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={oneDark}
          wrapLines
          showLineNumbers
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: "1.5rem",
            fontSize: "0.85rem",
          }}
        >
          {state.status === "success" ? state.content : ""}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const DocumentViewerComponent = ({
  file,
  sessionId,
}: {
  file?: FileNode;
  sessionId?: string;
}) => {
  const { t } = useT("translation");

  const resolvedUrl = React.useMemo(
    () => ensureAbsoluteUrl(file?.url),
    [file?.url],
  );
  const extension = React.useMemo(() => extractExtension(file), [file]);

  if (!file)
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-xl bg-muted/5 p-12 text-center text-muted-foreground">
        <File className="size-10 mb-4 opacity-20" />
        <p className="text-sm font-medium">
          {t("artifacts.viewer.selectFile")}
        </p>
        <p className="text-xs mt-1 opacity-50">
          {t("artifacts.viewer.supportedFormats")}
        </p>
      </div>
    );

  const textLanguage = getTextLanguage(extension, file.mimeType);

  if (textLanguage) {
    return (
      <TextDocumentViewer
        file={file}
        language={textLanguage}
        sessionId={sessionId}
        resolvedUrl={resolvedUrl}
      />
    );
  }

  if (!file.url)
    return (
      <StatusLayout
        icon={File}
        title={t("artifacts.viewer.processing")}
        desc={file.name}
      />
    );

  const docType = DOC_VIEWER_TYPE_MAP[extension];

  if (!docType)
    return (
      <StatusLayout
        icon={File}
        title={t("artifacts.viewer.notSupported")}
        desc={file.name}
        action={
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => resolvedUrl && window.open(resolvedUrl, "_blank")}
            >
              <ExternalLink className="size-4" />
              {t("artifacts.viewer.openInNewWindow")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (!resolvedUrl) return;
                const a = document.createElement("a");
                a.href = resolvedUrl;
                a.download = file.name;
                a.click();
              }}
            >
              <Download className="size-4" />
              {t("artifacts.viewer.downloadOriginal")}
            </Button>
          </div>
        }
      />
    );

  return (
    <div className={VIEW_CLASSNAME}>
      <DocViewer
        key={resolvedUrl ?? file.url}
        documents={[{ uri: resolvedUrl || file.url!, fileType: docType }]}
        config={{ header: { disableHeader: true } }}
        className="h-full"
      />
    </div>
  );
};

export const DocumentViewer = React.memo(DocumentViewerComponent);
DocumentViewer.displayName = "DocumentViewer";

interface StatusLayoutProps {
  icon: React.ElementType;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

const StatusLayout = ({
  icon: Icon,
  title,
  desc,
  action,
}: StatusLayoutProps) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-sm mx-auto">
    <div className="p-4 bg-muted rounded-full mb-4 opacity-50">
      <Icon className="size-10 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-base">{title}</h3>
    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    {action}
  </div>
);
