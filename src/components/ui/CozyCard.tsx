import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CozyCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "sm" | "md" | "lg";
}

export const CozyCard = forwardRef<HTMLDivElement, CozyCardProps>(
  (
    { className, variant = "default", padding = "md", children, ...props },
    ref
  ) => {
    const variants = {
      default: "bg-card border border-border/50 shadow-soft",
      elevated: "bg-card border border-border/30 shadow-lifted",
      outlined: "bg-transparent border-2 border-border",
    };

    const paddings = {
      sm: "p-3",
      md: "p-5",
      lg: "p-7",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CozyCard.displayName = "CozyCard";

export default CozyCard;
