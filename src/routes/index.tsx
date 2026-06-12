import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  Link2,
  Loader2,
  Copy,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Youtube,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import ytsumifyLogo from "@/assets/ytsumify-logo.png.asset.json";

/* ===================================================================
   WEBHOOK CONFIG — Update this URL as needed
   =================================================================== */
const WEBHOOK_URL = "https://workflow.ccbp.in/webhook/Summarize";

/* Key for reading the summary from the webhook response */
const SUMMARY_RESPONSE_KEY = "summary";

/* =================================================================== */

export const Route = createFileRoute("/")({
  component: Index,
});

type AppState =
  | { status: "idle" }
  | { status: "loading"; stage: number }
  | { status: "success-flash"; summary: string }
  | { status: "success"; summary: string }
  | { status: "error"; message: string };

const LOADING_STAGES = [
  "Connecting to n8n webhook…",
  "Extracting YouTube transcript…",
  "AI is generating the summary…",
  "Polishing the final output…",
];

/* ------------------------------------------------------------------
   YouTube URL validation
   ------------------------------------------------------------------ */
function isValidYouTubeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^https?:\/\/youtu\.be\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]{11}/,
  ];
  return patterns.some((p) => p.test(trimmed));
}

function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  const match =
    trimmed.match(/[?&]v=([\w-]{11})/) ??
    trimmed.match(/youtu\.be\/([\w-]{11})/) ??
    trimmed.match(/shorts\/([\w-]{11})/) ??
    trimmed.match(/live\/([\w-]{11})/);
  return match?.[1] ?? null;
}

/* ------------------------------------------------------------------
   Main component
   ------------------------------------------------------------------ */
function Index() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  /* Cycle loading text */
  useEffect(() => {
    if (state.status !== "loading") return;
    const id = setInterval(() => {
      setState((prev) =>
        prev.status === "loading"
          ? { status: "loading", stage: (prev.stage + 1) % LOADING_STAGES.length }
          : prev
      );
    }, 2500);
    return () => clearInterval(id);
  }, [state.status]);

  /* After flashing success indicator, transition into the full output */
  useEffect(() => {
    if (state.status !== "success-flash") return;
    const id = setTimeout(() => {
      setState((prev) =>
        prev.status === "success-flash"
          ? { status: "success", summary: prev.summary }
          : prev
      );
    }, 1100);
    return () => clearTimeout(id);
  }, [state.status]);

  const handleSubmit = useCallback(async () => {
    if (state.status === "loading") return;
    if (!isValidYouTubeUrl(url)) {
      toast.error("Please enter a valid YouTube URL", {
        description: "Supported: youtube.com/watch, youtu.be, shorts, live",
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    setState({ status: "loading", stage: 0 });

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const summary = data?.[SUMMARY_RESPONSE_KEY];

      if (typeof summary !== "string" || !summary.trim()) {
        throw new Error("The response did not contain a valid summary.");
      }

      setState({ status: "success-flash", summary });
      toast.success("Summary generated successfully!", {
        description: "Your video summary is ready below.",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setState({ status: "error", message });
      toast.error("Summarization failed", {
        description: message,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  }, [url, state.status]);

  const handleCopy = useCallback(async () => {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.summary);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [state]);

  const handleClear = useCallback(() => {
    setUrl("");
    setState({ status: "idle" });
    setCopied(false);
  }, []);

  const videoId = isValidYouTubeUrl(url) ? extractVideoId(url) : null;
  const isLoading = state.status === "loading";
  const isFlash = state.status === "success-flash";
  const isSuccess = state.status === "success";
  const isError = state.status === "error";
  const inputsDisabled = isLoading || isFlash;
  const showInputCard = !isLoading && !isFlash && !isSuccess;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b border-border bg-surface-raised/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={ytsumifyLogo.url} alt="YTSumify logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">YTSumify</h1>
              <p className="text-[11px] leading-none text-muted-foreground hidden sm:block">
                AI-powered video summaries in seconds
              </p>
            </div>
          </div>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <Youtube className="h-3.5 w-3.5" />
            YouTube
          </a>
        </div>
      </header>

      {/* Hero gradient — hide while processing to give the processing box full focus */}
      {showInputCard && (
        <div className="gradient-hero border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Summarize any YouTube video
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Paste a link below and let AI extract the key points, timestamps, and insights.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Input Card — only when idle/error */}
        {showInputCard && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <label htmlFor="yt-url" className="mb-2 block text-sm font-medium">
              YouTube URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="yt-url"
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                disabled={inputsDisabled}
                className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-60"
              />
              {url && (
                <button
                  onClick={() => setUrl("")}
                  disabled={inputsDisabled}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Thumbnail preview */}
            {videoId && (
              <div className="fade-in-up mt-4 overflow-hidden rounded-xl border border-border">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt="YouTube video thumbnail"
                  className="h-auto w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSubmit}
                disabled={inputsDisabled || !url.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Summarize
              </button>
              {isError && (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing Box — centered, full focus while loading or flashing success */}
        {(isLoading || isFlash) && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div
              className="fade-in-up w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10"
              role="status"
              aria-live="polite"
            >
              {isLoading ? (
                <>
                  {/* Pulsing spinner */}
                  <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-indigo/20" />
                    <span className="absolute inset-2 animate-pulse rounded-full bg-indigo/30" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                  </div>

                  {/* Cycling status text */}
                  <div className="text-center">
                    <p
                      key={state.stage}
                      className="fade-in-up text-base font-semibold tracking-tight"
                    >
                      {LOADING_STAGES[state.stage]}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Please hang tight — this usually takes 10–30 seconds.
                    </p>
                  </div>

                  {/* Progress bar shimmer */}
                  <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="skeleton-shimmer h-full w-full rounded-full" />
                  </div>

                  {/* Pulse dots */}
                  <div className="mt-6 flex justify-center gap-2">
                    <span className="pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-indigo" style={{ animationDelay: "0s" }} />
                    <span className="pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-indigo" style={{ animationDelay: "0.2s" }} />
                    <span className="pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-indigo" style={{ animationDelay: "0.4s" }} />
                  </div>
                </>
              ) : (
                <>
                  {/* Success flash */}
                  <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-success/30" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/40">
                      <Check className="h-8 w-8" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold tracking-tight text-success">
                      Summary generated successfully!
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Revealing your summary…
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="fade-in-up mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-destructive">Something went wrong</h3>
                <p className="mt-1 text-sm text-destructive/80">{state.message}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Try again
                  </button>
                  <button
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success / Output State */}
        {isSuccess && (
          <div className="fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Success banner */}
            <div className="flex items-center gap-2.5 border-b border-border bg-success/10 px-5 py-3">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">
                Summary generated successfully!
              </span>
            </div>

            {/* Output header */}
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-light">
                  <Sparkles className="h-4 w-4 text-indigo" />
                </div>
                <span className="text-sm font-semibold">Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.97]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Markdown output */}
            <div className="px-5 py-5 sm:px-7 sm:py-7">
              <article className="markdown-content text-sm text-foreground">
                <ReactMarkdown>{state.summary}</ReactMarkdown>
              </article>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center">
              <span className="text-xs text-muted-foreground">
                Generated by Summify YT
              </span>
              <button
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Summarize another video
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-surface-raised/50 py-6">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-xs text-muted-foreground">
            Summify YT — Built with AI. Not affiliated with YouTube.
          </p>
        </div>
      </footer>
    </div>
  );
}
