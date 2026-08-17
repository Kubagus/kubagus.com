import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}