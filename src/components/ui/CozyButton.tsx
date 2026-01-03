import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
interface CozyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}
export const CozyButton = forwardRef<HTMLButtonElement, CozyButtonProps>(({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:shadow-cozy hover:scale-[1.02] focus:ring-primary/50",
    secondary: "bg-secondary text-secondary-foreground hover:shadow-cozy hover:scale-[1.02] focus:ring-secondary/50",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/10 focus:ring-primary/50",
    ghost: "text-foreground bg-transparent hover:bg-muted focus:ring-muted"
  };
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  return;
});
CozyButton.displayName = "CozyButton";
export default CozyButton;