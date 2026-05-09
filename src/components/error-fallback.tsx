import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error;
  reset?: () => void;
  title?: string;
  description?: string;
  variant?: "page" | "panel";
};

export function ErrorFallback({ error, reset, title, description, variant = "page" }: Props) {
  const router = useRouter();
  const isDev = import.meta.env.DEV;

  const onRetry = () => {
    reset?.();
    void router.invalidate();
  };

  const wrapperClass =
    variant === "page"
      ? "flex min-h-screen items-center justify-center bg-background px-4"
      : "rounded-lg border border-destructive/30 bg-destructive/5 p-6";

  return (
    <div className={wrapperClass} role="alert" aria-live="assertive">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          {title ?? "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? "An unexpected error interrupted this view. You can retry, or head home."}
        </p>
        {isDev && error?.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={onRetry} size="sm">
            <RotateCw className="mr-2 h-4 w-4" /> Retry
          </Button>
          {variant === "page" && (
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="mr-2 h-4 w-4" /> Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
