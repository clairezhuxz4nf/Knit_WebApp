import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showPattern?: boolean;
}

export const MobileLayout = ({
  children,
  className,
  showPattern = false,
}: MobileLayoutProps) => {
  return (
    <div
      className={cn(
        "min-h-screen w-full max-w-md mx-auto bg-background relative overflow-x-hidden",
        showPattern && "yarn-pattern",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileLayout;
