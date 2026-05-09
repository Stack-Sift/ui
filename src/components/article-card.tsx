import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type ArticleCardData = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  published_at: string | null;
  source_name: string | null;
  domain: string | null;
  tags: string[];
  trend_score: string | null;
  estimated_read_min: number | null;
  bookmarked: boolean;
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const [saved, setSaved] = useState(article.bookmarked);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = new Set(JSON.parse(localStorage.getItem("stack-sift-bookmarks") ?? "[]") as string[]);
    if (saved) {
      ids.delete(article.id);
      setSaved(false);
    } else {
      ids.add(article.id);
      setSaved(true);
    }
    localStorage.setItem("stack-sift-bookmarks", JSON.stringify([...ids]));
  };

  return (
    <article className="group rounded-lg border border-border bg-card transition hover:shadow-sm">
      <Link to="/article/$id" params={{ id: article.id }} className="block p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {article.source_name && (
              <span className="font-medium text-foreground">{article.source_name}</span>
            )}
            {article.published_at && (
              <>
                <span>·</span>
                <time>{new Date(article.published_at).toLocaleDateString()}</time>
              </>
            )}
            {article.estimated_read_min && (
              <>
                <span>·</span>
                <span>{article.estimated_read_min} min read</span>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleBookmark} aria-label="Bookmark">
            {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-card-foreground group-hover:text-primary">
          {article.title}
        </h2>
        {article.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {article.domain && <Badge variant="outline" className="text-xs">{article.domain}</Badge>}
          {article.trend_score && <Badge className="text-xs capitalize">{article.trend_score}</Badge>}
          {article.tags.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs capitalize">
              {s}
            </Badge>
          ))}
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Original <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Link>
    </article>
  );
}
