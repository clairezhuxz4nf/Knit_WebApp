import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Search, Settings, Share2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import FamilyTreeView from "@/components/family/FamilyTreeView";
import EditMemberModal from "@/components/family/EditMemberModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  display_name: string | null;
  user_id: string;
  is_admin: boolean;
  birthday?: string | null;
}

interface FamilySpaceData {
  id: string;
  name: string;
  family_code: string;
}


const Family = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [familySpace, setFamilySpace] = useState<FamilySpaceData | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

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
        .select("id, display_name, user_id, is_admin, birthday")
        .eq("family_space_id", memberData.family_space_id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveMember = async (id: string, name: string, birthday: Date | null) => {
    const { error } = await supabase
      .from("family_members")
      .update({
        display_name: name,
        birthday: birthday ? birthday.toISOString().split("T")[0] : null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update member.",
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Updated!",
      description: "Family member updated successfully.",
    });

    // Refresh members list
    fetchFamilyData();
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
      <div className="relative bg-gradient-to-b from-secondary/40 to-background">
        {/* Settings button */}
        <button
          onClick={() => navigate("/family-settings")}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/50 backdrop-blur-sm z-10"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Title */}
        <div className="text-center px-6 pt-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold text-secondary-foreground"
          >
            {familySpace?.name || "Your Family"} Tree
          </motion.h1>
        </div>

        {/* Tree visualization */}
        <FamilyTreeView
          members={members}
          onNodeClick={(member) => setEditingMember(member)}
          onAddClick={() => setShowInviteCode(true)}
        />
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

      {/* Edit member modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMember}
        />
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Family;
