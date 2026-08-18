import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

/** Logo berupa "|<_" (mirip huruf K). */
export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-md bg-primary font-mono text-lg font-bold leading-none text-primary-foreground",
        className,
      )}
      aria-label="kubagus.com"
    >
      {"|<_"}
    </span>
  );
}