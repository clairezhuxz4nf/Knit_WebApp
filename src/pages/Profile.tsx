import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Calendar, Phone, LogOut, Save, Camera } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  birthday: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    birthday: "",
    avatar_url: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          birthday: data.birthday || "",
          avatar_url: data.avatar_url || "",
        });
      }

      // Get phone from auth user metadata
      setPhoneNumber(user.phone || "");
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name || null,
          birthday: profile.birthday || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Also update family_members display_name if they belong to a family
      const { data: memberData } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData) {
        await supabase
          .from("family_members")
          .update({
            display_name: profile.display_name || null,
            birthday: profile.birthday || null,
          })
          .eq("user_id", user.id);
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/welcome-page");
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
      <Header title="My Profile" />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24 space-y-6">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-primary" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CozyCard className="space-y-4">
            <CozyInput
              label="Display Name"
              placeholder="Your name"
              value={profile.display_name || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, display_name: e.target.value }))
              }
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Birthday
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={profile.birthday || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, birthday: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your birthday will appear in the family chronicle
              </p>
            </div>
          </CozyCard>
        </motion.div>

        {/* Phone Number */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <CozyCard className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phoneNumber}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contact support to change your phone number
              </p>
            </div>
          </CozyCard>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CozyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={saveProfile}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Profile"}
          </CozyButton>
        </motion.div>

        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <CozyButton
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </CozyButton>
        </motion.div>

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-4"
        >
          <YarnDecoration variant="wave" color="sage" className="w-32" />
        </motion.div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Profile;
