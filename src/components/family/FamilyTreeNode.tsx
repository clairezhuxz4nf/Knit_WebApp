import { motion } from "framer-motion";

interface FamilyTreeNodeProps {
  name: string;
  color: string;
  size?: "lg" | "md" | "sm";
  onClick: () => void;
  delay?: number;
}

const FamilyTreeNode = ({ name, color, size = "md", onClick, delay = 0 }: FamilyTreeNodeProps) => {
  const sizeClasses = {
    lg: "w-16 h-16",
    md: "w-14 h-14",
    sm: "w-12 h-12",
  };

  const textSizes = {
    lg: "text-xs",
    md: "text-[10px]",
    sm: "text-[9px]",
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 300 }}
      className="flex flex-col items-center gap-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Node container with yarn-like border */}
      <div
        className={`${sizeClasses[size]} rounded-lg border-4 flex items-center justify-center bg-card shadow-cozy hover:shadow-lifted transition-all hover:scale-105`}
        style={{ borderColor: `hsl(var(--yarn-${color}))` }}
      >
        {/* Face icon */}
        <div className="flex flex-col items-center">
          <div className="flex gap-1 mb-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `hsl(var(--yarn-${color}))` }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `hsl(var(--yarn-${color}))` }}
            />
          </div>
          <div
            className="w-3 h-1.5 rounded-b-full border-b-2 border-l border-r"
            style={{ borderColor: `hsl(var(--yarn-${color}))` }}
          />
        </div>
      </div>
      {/* Name label */}
      <span
        className={`font-display font-semibold uppercase tracking-wide ${textSizes[size]}`}
        style={{ color: `hsl(var(--yarn-${color}))` }}
      >
        {name.split(" ")[0].slice(0, 8)}
      </span>
    </motion.div>
  );
};

export default FamilyTreeNode;
