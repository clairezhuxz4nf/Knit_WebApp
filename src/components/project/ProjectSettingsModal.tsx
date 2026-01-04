import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Book,
  Check,
  Users,
  Settings,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import CozyInput from "@/components/ui/CozyInput";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Person {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  user_id: string | null;
}

interface Contributor {
  id: string;
  person_id: string;
  user_id: string | null;
  status: string;
  person: Person;
}

interface ProjectAsset {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  created_by: string;
  family_space_id: string;
  status: string;
  progress: number;
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onProjectDeleted: () => void;
  onProjectUpdated: (project: Project) => void;
}

const ProjectSettingsModal = ({
  isOpen,
  onClose,
  projectId,
  onProjectDeleted,
  onProjectUpdated,
}: ProjectSettingsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contributors");
  const [project, setProject] = useState<Project | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEmoji, setEditEmoji] = useState("📁");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectData();
    }
  }, [isOpen, projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        toast.error("Project not found");
        onClose();
        return;
      }

      setProject(projectData);
      setEditTitle(projectData.title);
      setEditDescription(projectData.description || "");
      setEditEmoji(projectData.emoji || "📁");

      // Check if user is admin (project creator or family admin)
      const isCreator = projectData.created_by === user?.id;
      
      const { data: adminCheck } = await supabase
        .from("people")
        .select("is_admin")
        .eq("family_space_id", projectData.family_space_id)
        .eq("user_id", user?.id)
        .maybeSingle();

      setIsAdmin(isCreator || adminCheck?.is_admin === true);

      // Fetch contributors with person details
      const { data: contributorData, error: contributorError } = await supabase
        .from("project_contributors")
        .select(`
          id,
          person_id,
          user_id,
          status,
          person:people!project_contributors_person_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            user_id
          )
        `)
        .eq("project_id", projectId);

      if (contributorError) throw contributorError;
      
      // Transform the data to match our interface
      const transformedContributors = (contributorData || []).map((c: any) => ({
        ...c,
        person: Array.isArray(c.person) ? c.person[0] : c.person,
      }));
      setContributors(transformedContributors);

      // Fetch all family members for invite options
      const { data: familyData, error: familyError } = await supabase
        .from("people")
        .select("id, first_name, last_name, avatar_url, user_id")
        .eq("family_space_id", projectData.family_space_id);

      if (familyError) throw familyError;
      setFamilyMembers(familyData || []);

      // Fetch project assets from storage
      const { data: assetData, error: assetError } = await supabase.storage
        .from("project-assets")
        .list(projectId);

      if (!assetError) {
        setAssets(assetData as ProjectAsset[] || []);
      }
    } catch (error: any) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteContributor = async (personId: string) => {
    if (!user || !project) return;

    try {
      const { error } = await supabase.from("project_contributors").insert({
        project_id: projectId,
        person_id: personId,
        invited_by: user.id,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Contributor invited!");
      fetchProjectData();
    } catch (error: any) {
      console.error("Error inviting contributor:", error);
      toast.error("Failed to invite contributor");
    }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    try {
      const { error } = await supabase
        .from("project_contributors")
        .delete()
        .eq("id", contributorId);

      if (error) throw error;
      toast.success("Contributor removed");
      fetchProjectData();
    } catch (error: any) {
      console.error("Error removing contributor:", error);
      toast.error("Failed to remove contributor");
    }
  };

  const handleSaveProject = async () => {
    if (!project) {
      toast.error("No project to update");
      return;
    }
    
    if (!editTitle.trim()) {
      toast.error("Project name is required");
      return;
    }
    
    setSaving(true);

    try {
      console.log("Updating project:", projectId, { title: editTitle, description: editDescription, emoji: editEmoji });
      
      const { data, error } = await supabase
        .from("projects")
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          emoji: editEmoji,
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Update successful:", data);
      setProject(data);
      onProjectUpdated(data);
      setIsEditing(false);
      toast.success("Project updated!");
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error(error.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      // First delete all assets from storage
      if (assets.length > 0) {
        const filePaths = assets.map((a) => `${projectId}/${a.name}`);
        await supabase.storage.from("project-assets").remove(filePaths);
      }

      // Delete the project (cascades to contributors)
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project deleted");
      onProjectDeleted();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const getAssetUrl = (assetName: string) => {
    const { data } = supabase.storage
      .from("project-assets")
      .getPublicUrl(`${projectId}/${assetName}`);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get available people to invite (not already contributors)
  const availableToInvite = familyMembers.filter(
    (person) =>
      !contributors.some((c) => c.person_id === person.id) &&
      person.id !== project?.created_by
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/50 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full bg-background rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold">
              Project Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="contributors" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Contributors</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Assets</span>
                </TabsTrigger>
              </TabsList>

              {/* Contributors Tab */}
              <TabsContent value="contributors" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Current Contributors
                  </h3>
                  {contributors.length === 0 ? (
                    <CozyCard>
                      <p className="text-center text-muted-foreground py-4">
                        No contributors yet
                      </p>
                    </CozyCard>
                  ) : (
                    <div className="space-y-2">
                      {contributors.map((contributor) => (
                        <CozyCard key={contributor.id}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                {contributor.person?.avatar_url ? (
                                  <img
                                    src={contributor.person.avatar_url}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-primary font-semibold">
                                    {contributor.person?.first_name?.[0] || "?"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {contributor.person?.first_name}{" "}
                                  {contributor.person?.last_name || ""}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {contributor.status}
                                </p>
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveContributor(contributor.id)}
                                className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </CozyCard>
                      ))}
                    </div>
                  )}
                </div>

                {availableToInvite.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Invite Family Members
                    </h3>
                    <div className="space-y-2">
                      {availableToInvite.map((person) => (
                        <CozyCard key={person.id}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                {person.avatar_url ? (
                                  <img
                                    src={person.avatar_url}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-secondary font-semibold">
                                    {person.first_name?.[0] || "?"}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-foreground">
                                {person.first_name} {person.last_name || ""}
                              </p>
                            </div>
                            <button
                              onClick={() => handleInviteContributor(person.id)}
                              className="p-2 rounded-full hover:bg-primary/10 text-primary"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </div>
                        </CozyCard>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <EmojiPicker
                      label="Project Icon"
                      value={editEmoji}
                      onChange={setEditEmoji}
                    />
                    <CozyInput
                      label="Project Name"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <CozyInput
                      label="Description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <CozyButton
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setEditTitle(project?.title || "");
                          setEditDescription(project?.description || "");
                          setEditEmoji(project?.emoji || "📁");
                        }}
                      >
                        Cancel
                      </CozyButton>
                      <CozyButton
                        variant="primary"
                        onClick={handleSaveProject}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </CozyButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <CozyCard>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {project?.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {project?.description || "No description"}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-full hover:bg-muted"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </CozyCard>

                    <CozyCard>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Status</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {project?.status?.replace("_", " ")}
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-secondary" />
                      </div>
                    </CozyCard>

                    <CozyCard>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Your Role</p>
                          <p className="text-sm text-muted-foreground">
                            {isAdmin ? "Admin" : "Contributor"}
                          </p>
                        </div>
                        {isAdmin && <Check className="w-5 h-5 text-secondary" />}
                      </div>
                    </CozyCard>

                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <CozyButton
                            variant="ghost"
                            fullWidth
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </CozyButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the project and all
                              its assets. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProject}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="space-y-4">
                {assets.length === 0 ? (
                  <CozyCard>
                    <div className="text-center py-8">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No assets yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload images and files in the chat to add them here
                      </p>
                    </div>
                  </CozyCard>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {assets.map((asset) => (
                      <CozyCard key={asset.id} className="p-2">
                        {asset.metadata?.mimetype?.startsWith("image/") ? (
                          <img
                            src={getAssetUrl(asset.name)}
                            alt={asset.name}
                            className="w-full h-24 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-2">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-foreground truncate">
                          {asset.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(asset.metadata?.size || 0)}
                        </p>
                      </CozyCard>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectSettingsModal;
