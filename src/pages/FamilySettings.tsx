import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, Trash2, Calendar, User, LogOut } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  user_id: string;
  display_name: string | null;
  birthday: string | null;
  is_admin: boolean;
}

interface FamilySpace {
  id: string;
  name: string;
  family_code: string;
}

const FamilySettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editBirthday, setEditBirthday] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFamilyData();
    }
  }, [user]);

  const fetchFamilyData = async () => {
    if (!user) return;

    try {
      // Get family space the user belongs to
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("family_space_id, is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        navigate("/welcome-page");
        return;
      }

      setIsAdmin(memberData.is_admin);

      // Get family space details
      const { data: spaceData, error: spaceError } = await supabase
        .from("family_spaces")
        .select("*")
        .eq("id", memberData.family_space_id)
        .single();

      if (spaceError) throw spaceError;
      setFamilySpace(spaceData);

      // Get all family members
      const { data: membersData, error: membersError } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_space_id", memberData.family_space_id)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error: any) {
      console.error("Error fetching family data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load family settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyFamilyCode = async () => {
    if (familySpace?.family_code) {
      await navigator.clipboard.writeText(familySpace.family_code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Family code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateMemberBirthday = async (memberId: string, birthday: string) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .update({ birthday: birthday || null })
        .eq("id", memberId);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, birthday } : m))
      );
      setEditingMember(null);
      toast({
        title: "Updated",
        description: "Birthday has been updated",
      });
    } catch (error: any) {
      console.error("Error updating birthday:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update birthday",
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({
        title: "Removed",
        description: "Family member has been removed",
      });
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header title="Family Settings" showBack />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24 space-y-6">
        {/* Family Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CozyCard variant="elevated" className="text-center">
            <YarnDecoration
              variant="heart"
              color="rose"
              className="w-10 h-10 mx-auto mb-3"
            />
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">
              Family Code
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Share this code with family members to join
            </p>

            <div className="bg-muted rounded-xl p-4 flex items-center justify-center gap-3 mb-4">
              <span className="font-mono text-3xl font-bold tracking-widest text-foreground">
                {familySpace?.family_code}
              </span>
              <button
                onClick={copyFamilyCode}
                className="p-2 rounded-lg bg-card hover:bg-primary/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-secondary" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {familySpace?.name}
            </p>
          </CozyCard>
        </motion.div>

        {/* Family Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-3">
            Family Members ({members.length})
          </h3>

          <div className="space-y-3">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CozyCard padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {member.display_name || "Family Member"}
                        </h4>
                        {member.is_admin && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            Admin
                          </span>
                        )}
                        {member.user_id === user?.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>

                      {editingMember === member.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="date"
                            value={editBirthday}
                            onChange={(e) => setEditBirthday(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                          />
                          <button
                            onClick={() => updateMemberBirthday(member.id, editBirthday)}
                            className="p-2 rounded-lg bg-primary text-primary-foreground"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMember(member.id);
                            setEditBirthday(member.birthday || "");
                          }}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-1"
                        >
                          <Calendar className="w-3 h-3" />
                          {member.birthday
                            ? new Date(member.birthday).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Add birthday"}
                        </button>
                      )}
                    </div>

                    {isAdmin && member.user_id !== user?.id && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </CozyCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Profile & Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <CozyButton
            variant="outline"
            fullWidth
            onClick={() => navigate("/profile")}
          >
            <User className="w-4 h-4" />
            Manage My Profile
          </CozyButton>

          <CozyButton
            variant="ghost"
            fullWidth
            onClick={handleSignOut}
            className="text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </CozyButton>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default FamilySettings;
