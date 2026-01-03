import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Search, QrCode, Plus, Settings, Share2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  display_name: string | null;
  user_id: string;
  is_admin: boolean;
}

interface FamilySpaceData {
  id: string;
  name: string;
  family_code: string;
}

interface TreeNode {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

const Family = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [familySpace, setFamilySpace] = useState<FamilySpaceData | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchFamilyData();
    }
  }, [user, loading, navigate]);

  const fetchFamilyData = async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        navigate("/welcome-page");
        return;
      }

      const { data: spaceData, error: spaceError } = await supabase
        .from("family_spaces")
        .select("*")
        .eq("id", memberData.family_space_id)
        .single();

      if (spaceError) throw spaceError;
      setFamilySpace(spaceData);

      const { data: membersData, error: membersError } = await supabase
        .from("family_members")
        .select("id, display_name, user_id, is_admin")
        .eq("family_space_id", memberData.family_space_id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const generateTreeNodes = (): TreeNode[] => {
    const colors = ["rose", "sage", "butter", "teal"];
    const centerX = 150;
    const centerY = 120;
    const radius = 80;

    return members.map((member, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(members.length, 1) - Math.PI / 2;
      const x = index === 0 ? centerX : centerX + radius * Math.cos(angle);
      const y = index === 0 ? centerY : centerY + radius * Math.sin(angle);

      return {
        id: member.id,
        name: member.display_name || "Family Member",
        x,
        y,
        color: colors[index % colors.length],
      };
    });
  };

  const copyInviteCode = () => {
    if (familySpace?.family_code) {
      navigator.clipboard.writeText(familySpace.family_code);
      toast({
        title: "Code copied!",
        description: "Share this code with family members to join.",
      });
    }
  };

  const treeNodes = generateTreeNodes();

  if (loading || dataLoading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="pb-20">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-b from-secondary/40 to-background min-h-[320px]">
        {/* Settings button */}
        <button
          onClick={() => navigate("/family-settings")}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/50 backdrop-blur-sm"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Tree visualization */}
        <div className="relative w-full h-64 flex items-center justify-center">
          <svg
            width="300"
            height="240"
            viewBox="0 0 300 240"
            className="overflow-visible"
          >
            {/* Connection lines */}
            {treeNodes.length > 1 &&
              treeNodes.slice(1).map((node, index) => (
                <motion.line
                  key={`line-${node.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  x1={treeNodes[0].x}
                  y1={treeNodes[0].y}
                  x2={node.x}
                  y2={node.y}
                  stroke="hsl(var(--yarn-sage))"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                />
              ))}

            {/* Tree nodes */}
            {treeNodes.map((node, index) => (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={index === 0 ? 35 : 28}
                  fill={`hsl(var(--yarn-${node.color}))`}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={index === 0 ? 30 : 23}
                  fill="hsl(var(--card))"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-xs font-medium pointer-events-none"
                  fontSize={index === 0 ? "11" : "9"}
                >
                  {node.name.split(" ")[0].slice(0, 6)}
                </text>
              </motion.g>
            ))}

            {/* Add member button */}
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              onClick={() => setShowInviteCode(true)}
              className="cursor-pointer"
            >
              <circle
                cx={250}
                cy={200}
                r={22}
                fill="hsl(var(--primary))"
                className="hover:opacity-80 transition-opacity"
              />
              <text
                x={250}
                y={200}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary-foreground text-lg font-bold"
              >
                +
              </text>
            </motion.g>
          </svg>
        </div>

        {/* Title */}
        <div className="text-center px-6 -mt-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold text-secondary-foreground"
          >
            {familySpace?.name || "Your Family"} Tree
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm mt-1"
          >
            Connect nodes to see stories shared between relatives
          </motion.p>
        </div>
      </div>

      {/* Action cards */}
      <div className="px-6 -mt-2 space-y-3">
        {/* Invite card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CozyCard
            className="cursor-pointer hover:shadow-cozy transition-all"
            onClick={() => setShowInviteCode(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Invite your family</h3>
                <p className="text-sm text-muted-foreground">
                  Get rewarded when they join!
                </p>
              </div>
            </div>
          </CozyCard>
        </motion.div>

        {/* Code actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <CozyCard
            className="flex-1 cursor-pointer hover:shadow-cozy transition-all"
            onClick={() => navigate("/join-family-space")}
          >
            <div className="flex flex-col items-center gap-2 py-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Enter code</span>
            </div>
          </CozyCard>

          <CozyCard
            className="flex-1 cursor-pointer hover:shadow-cozy transition-all"
            onClick={copyInviteCode}
          >
            <div className="flex flex-col items-center gap-2 py-2">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Share code</span>
            </div>
          </CozyCard>
        </motion.div>

        {/* Members list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 mt-4">
            Family Members ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((member, index) => (
              <CozyCard key={member.id} className="py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold ${
                      index % 4 === 0
                        ? "bg-primary"
                        : index % 4 === 1
                        ? "bg-secondary"
                        : index % 4 === 2
                        ? "bg-accent text-accent-foreground"
                        : "bg-teal text-teal-foreground"
                    }`}
                  >
                    {(member.display_name || "FM")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {member.display_name || "Family Member"}
                    </p>
                    {member.is_admin && (
                      <span className="text-xs text-primary">Admin</span>
                    )}
                  </div>
                </div>
              </CozyCard>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Invite code modal */}
      {showInviteCode && familySpace && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowInviteCode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lifted"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold text-center mb-2">
              Invite Family
            </h3>
            <p className="text-muted-foreground text-sm text-center mb-4">
              Share this code with family members
            </p>
            <div className="bg-muted rounded-xl p-4 text-center mb-4">
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                {familySpace.family_code}
              </span>
            </div>
            <CozyButton
              variant="primary"
              className="w-full"
              onClick={copyInviteCode}
            >
              Copy Code
            </CozyButton>
          </motion.div>
        </motion.div>
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Family;
