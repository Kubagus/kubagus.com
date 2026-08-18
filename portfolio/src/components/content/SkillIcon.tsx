import { useState } from "react";
import { Code } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface SkillIconProps {
  icon: string | null;
  className?: string;
}

function isImageSource(value: string): boolean {
  return (
    value.startsWith("http") ||
    value.startsWith("/") ||
    value.startsWith("data:") ||
    value.endsWith(".png") ||
    value.endsWith(".svg")
  );
}

/** Ikon skill: gambar (URL/path/data URI) atau nama logo via cdn.simpleicons.org. */
export function SkillIcon({ icon, className }: SkillIconProps) {
  const { theme } = useTheme();
  const [broken, setBroken] = useState(false);

  if (!icon || broken) return <Code className={className} />;

  let src: string;
  if (isImageSource(icon)) {
    src = icon;
  } else {
    const color = theme === "dark" ? "e5e7eb" : "1f2937";
    src = `https://cdn.simpleicons.org/${encodeURIComponent(icon)}/${color}`;
  }

  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={className} />;
}