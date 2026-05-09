import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> & {
  /** Required — prevents layout shift (CLS). */
  width: number;
  /** Required — prevents layout shift (CLS). */
  height: number;
  /** Lazy by default; set "eager" for above-the-fold (LCP) images. */
  priority?: boolean;
  /** Optional fallback rendered when the image fails to load. */
  fallback?: React.ReactNode;
};

/**
 * Drop-in <img> wrapper that enforces production-grade image hygiene:
 * - explicit width/height to eliminate CLS
 * - lazy loading by default; eager + fetchpriority="high" when priority is true
 * - decoding="async" so decode never blocks the main thread
 * - graceful fallback on load error
 *
 * Always pass meaningful alt text. Pass alt="" only for purely decorative images.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fallback,
  className,
  sizes,
  srcSet,
  ...rest
}: Props) {
  const [errored, setErrored] = useState(false);

  if (errored && fallback) return <>{fallback}</>;

  return (
    <img
      {...rest}
      src={src}
      alt={alt ?? ""}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={srcSet}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={(e) => {
        setErrored(true);
        rest.onError?.(e);
      }}
      className={cn("max-w-full h-auto", className)}
    />
  );
}
