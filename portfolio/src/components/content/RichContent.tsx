import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface RichContentProps {
  html: string | null;
  className?: string;
}

export function RichContent({ html, className }: RichContentProps) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "rich-content prose prose-neutral max-w-none dark:prose-invert",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}