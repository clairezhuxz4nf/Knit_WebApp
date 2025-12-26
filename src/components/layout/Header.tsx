import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  rightElement?: ReactNode;
  className?: string;
}

export const Header = ({
  title,
  showBack = false,
  showSettings = false,
  onSettingsClick,
  rightElement,
  className,
}: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/30",
        "px-4 py-3 flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-[60px]">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {title && (
        <h1 className="font-display text-lg font-semibold text-foreground text-center flex-1">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2 min-w-[60px] justify-end">
        {showSettings && (
          <button
            onClick={onSettingsClick}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        )}
        {rightElement}
      </div>
    </header>
  );
};

export default Header;
