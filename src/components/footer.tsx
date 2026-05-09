import { cn } from "@/lib/utils";

type Props = {
  /** "page" pads vertically for use under wide content; "compact" is tighter for auth pages. */
  variant?: "page" | "compact";
  className?: string;
};

export function Footer({ variant = "page", className }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        "border-t border-border text-center text-xs text-muted-foreground",
        variant === "page" ? "py-6 px-6" : "py-4 px-4",
        className,
      )}
    >
      <p>
        © {year} Stack Sift · Made by{" "}
        <a
          href="https://akhilkathi.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          Akhil Kathi
        </a>
      </p>
    </footer>
  );
}
