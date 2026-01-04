import { cn } from "@/lib/utils";
interface YarnDecorationProps {
  className?: string;
  variant?: "wave" | "spiral" | "heart" | "ball";
  color?: "rose" | "sage" | "butter" | "teal";
}
export const YarnDecoration = ({
  className,
  variant = "wave",
  color = "rose"
}: YarnDecorationProps) => {
  const colorMap = {
    rose: "stroke-yarn-rose",
    sage: "stroke-yarn-sage",
    butter: "stroke-yarn-butter",
    teal: "stroke-yarn-teal"
  };
  const fillColorMap = {
    rose: "fill-yarn-rose",
    sage: "fill-yarn-sage",
    butter: "fill-yarn-butter",
    teal: "fill-yarn-teal"
  };
  if (variant === "wave") {
    return;
  }
  if (variant === "spiral") {
    return <svg className={cn("w-12 h-12", className)} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 5 Q35 15 25 25 Q15 35 25 45" className={cn(colorMap[color], "fill-none")} strokeWidth="3" strokeLinecap="round" />
      </svg>;
  }
  if (variant === "ball") {
    return <svg className={cn("w-10 h-10", className)} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="15" className={cn(fillColorMap[color], "opacity-30")} />
        <circle cx="20" cy="20" r="15" className={cn(colorMap[color], "fill-none")} strokeWidth="2" />
        <path d="M10 15 Q20 10 30 15 M10 20 Q20 15 30 20 M10 25 Q20 20 30 25" className={cn(colorMap[color], "fill-none opacity-60")} strokeWidth="1.5" />
      </svg>;
  }

  // heart variant
  return <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 28 C6 20 2 14 6 8 C10 2 16 6 16 10 C16 6 22 2 26 8 C30 14 26 20 16 28Z" className={cn(fillColorMap[color], "opacity-80")} />
    </svg>;
};
export default YarnDecoration;