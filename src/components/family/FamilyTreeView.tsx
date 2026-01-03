import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import FamilyTreeNode from "./FamilyTreeNode";

interface FamilyMember {
  id: string;
  display_name: string | null;
  user_id: string;
  is_admin: boolean;
  birthday?: string | null;
}

interface FamilyTreeViewProps {
  members: FamilyMember[];
  onNodeClick: (member: FamilyMember) => void;
  onAddClick: () => void;
}

const FamilyTreeView = ({ members, onNodeClick, onAddClick }: FamilyTreeViewProps) => {
  const colors = ["sage", "rose", "butter", "teal"];
  
  // Organize members into tiers for hierarchical display
  // First member (admin) goes to top, rest distributed below
  const topTier = members.slice(0, 1);
  const middleTier = members.slice(1, 4);
  const bottomTier = members.slice(4);

  return (
    <div className="relative w-full flex flex-col items-center py-6">
      {/* Decorative frame top - yarn rope look */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-transparent to-yarn-brown rounded-full" />
      
      {/* Main tree container */}
      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border-4 border-yarn-brown p-6 min-h-[280px] w-[320px] shadow-lifted">
        {/* Decorative corner yarn balls */}
        <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-yarn-rose" />
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yarn-sage" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-yarn-butter" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-yarn-teal" />

        {/* Top tier - Parents/Hearts */}
        {topTier.length > 0 && (
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Overlapping hearts decoration */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex -space-x-3 mb-2 justify-center"
              >
                <div className="w-8 h-8 rotate-[-15deg]">
                  <svg viewBox="0 0 24 24" fill="hsl(var(--yarn-sage))" className="w-full h-full">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="w-8 h-8 rotate-[15deg]">
                  <svg viewBox="0 0 24 24" fill="hsl(var(--yarn-rose))" className="w-full h-full">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Connection line from hearts to middle tier */}
        {middleTier.length > 0 && (
          <div className="flex justify-center mb-2">
            <div className="w-0.5 h-4 bg-yarn-brown rounded-full" />
          </div>
        )}

        {/* Horizontal connection line for middle tier */}
        {middleTier.length > 1 && (
          <div className="flex justify-center mb-2">
            <div 
              className="h-0.5 bg-yarn-brown rounded-full"
              style={{ width: `${Math.min(middleTier.length * 70, 210)}px` }}
            />
          </div>
        )}

        {/* Vertical connectors to each middle tier node */}
        {middleTier.length > 0 && (
          <div className="flex justify-center gap-6 mb-1">
            {middleTier.map((_, idx) => (
              <div key={idx} className="w-0.5 h-3 bg-yarn-brown rounded-full" />
            ))}
          </div>
        )}

        {/* Middle tier - Children */}
        <div className="flex justify-center gap-4 mb-4">
          {middleTier.map((member, idx) => (
            <FamilyTreeNode
              key={member.id}
              name={member.display_name || "Member"}
              color={colors[(idx + 1) % colors.length]}
              size="md"
              onClick={() => onNodeClick(member)}
              delay={idx * 0.1 + 0.2}
            />
          ))}
        </div>

        {/* Connection to bottom tier */}
        {bottomTier.length > 0 && middleTier.length > 0 && (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-0.5 h-4 bg-yarn-brown rounded-full" />
            </div>
            {bottomTier.length > 1 && (
              <div className="flex justify-center mb-2">
                <div 
                  className="h-0.5 bg-yarn-brown rounded-full"
                  style={{ width: `${Math.min(bottomTier.length * 60, 180)}px` }}
                />
              </div>
            )}
            <div className="flex justify-center gap-4 mb-1">
              {bottomTier.map((_, idx) => (
                <div key={idx} className="w-0.5 h-3 bg-yarn-brown rounded-full" />
              ))}
            </div>
          </>
        )}

        {/* Bottom tier - Grandchildren */}
        {bottomTier.length > 0 && (
          <div className="flex justify-center gap-3">
            {bottomTier.map((member, idx) => (
              <FamilyTreeNode
                key={member.id}
                name={member.display_name || "Member"}
                color={colors[(idx + 3) % colors.length]}
                size="sm"
                onClick={() => onNodeClick(member)}
                delay={idx * 0.1 + 0.4}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm mb-2">No family members yet</p>
            <p className="text-xs">Invite your family to get started!</p>
          </div>
        )}

        {/* Add member button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          onClick={onAddClick}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-cozy hover:shadow-lifted hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </motion.button>
      </div>

      {/* Tree title */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center text-muted-foreground text-sm mt-4"
      >
        Tap a family member to edit
      </motion.p>
    </div>
  );
};

export default FamilyTreeView;
