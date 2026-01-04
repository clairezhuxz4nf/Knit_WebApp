import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Plus, Users } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import FamilyTreeCanvas from "@/components/family/FamilyTreeCanvas";
import EditPersonModal from "@/components/family/EditPersonModal";
import AddRelativeModal from "@/components/family/AddRelativeModal";
import InviteModal from "@/components/family/InviteModal";
import CreateSelfNodeModal from "@/components/family/CreateSelfNodeModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyTree } from "@/hooks/useFamilyTree";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Person } from "@/types/family";
interface FamilySpaceData {
  id: string;
  name: string;
  family_code: string;
}
const Family = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [familySpace, setFamilySpace] = useState<FamilySpaceData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal states
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [addingRelative, setAddingRelative] = useState<{
    fromPerson: Person;
    type: 'parent' | 'child' | 'spouse';
  } | null>(null);
  const [invitingPerson, setInvitingPerson] = useState<Person | null>(null);
  const [showCreateSelf, setShowCreateSelf] = useState(false);
  const {
    people,
    relationships,
    loading: treeLoading,
    currentUserPerson,
    createSelfNode,
    addRelative,
    updatePerson,
    generateInvite
  } = useFamilyTree(familySpace?.id || null);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchFamilySpace();
    }
  }, [user, authLoading, navigate]);
  const fetchFamilySpace = async () => {
    if (!user) return;
    try {
      const {
        data: memberData,
        error: memberError
      } = await supabase.from("people").select("family_space_id").eq("user_id", user.id).maybeSingle();
      if (memberError) throw memberError;
      if (!memberData) {
        navigate("/welcome-page");
        return;
      }
      const {
        data: spaceData,
        error: spaceError
      } = await supabase.from("family_spaces").select("*").eq("id", memberData.family_space_id).single();
      if (spaceError) throw spaceError;
      setFamilySpace(spaceData);
    } catch (error) {
      console.error("Error fetching family space:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Handlers
  const handleEditPerson = useCallback((person: Person) => {
    setEditingPerson(person);
  }, []);
  const handleAddRelative = useCallback((person: Person, type: 'parent' | 'child' | 'spouse') => {
    setAddingRelative({
      fromPerson: person,
      type
    });
  }, []);
  const handleInvitePerson = useCallback((person: Person) => {
    setInvitingPerson(person);
  }, []);
  const handleSavePerson = async (personId: string, updates: {
    first_name: string;
    last_name?: string;
    birth_date?: string;
  }) => {
    await updatePerson(personId, updates);
  };
  const handleAddRelativeSubmit = async (fromPerson: Person, type: 'parent' | 'child' | 'spouse', name: string) => {
    return await addRelative(fromPerson, type, name);
  };
  const handleCreateSelf = async (firstName: string, lastName?: string) => {
    await createSelfNode(firstName, lastName);
  };
  if (authLoading || dataLoading) {
    return <MobileLayout className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </MobileLayout>;
  }
  return <MobileLayout className="pb-20">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-b from-secondary/40 to-background">
        {/* Settings button */}
        

        {/* Title */}
        <div className="text-center px-6 pt-6 pb-4">
          <motion.h1 initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="font-display text-2xl font-bold text-secondary-foreground">
            {familySpace?.name || "Your Family"} Tree
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-1">
            {people.length} member{people.length !== 1 ? 's' : ''} • Tap nodes to interact
          </p>
        </div>

        {/* Tree visualization or empty state */}
        <div className="px-4">
          {treeLoading ? <div className="h-[350px] rounded-2xl bg-card/50 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
            </div> : people.length === 0 ? <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="h-[350px] rounded-2xl border-4 border-dashed border-yarn-brown/30 bg-card/50 flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Start Your Family Tree
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Add yourself as the first member to begin building your tree
              </p>
              <CozyButton variant="primary" onClick={() => setShowCreateSelf(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Yourself
              </CozyButton>
            </motion.div> : <FamilyTreeCanvas people={people} relationships={relationships} currentUserPerson={currentUserPerson} onEditPerson={handleEditPerson} onAddRelative={handleAddRelative} onInvitePerson={handleInvitePerson} />}
        </div>

        {/* Add first member button when tree exists but user hasn't created their node */}
        {people.length > 0 && !currentUserPerson && <div className="px-6 mt-4">
            <CozyButton variant="primary" className="w-full" onClick={() => setShowCreateSelf(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Yourself to the Tree
            </CozyButton>
          </div>}
      </div>

      {/* Action cards */}
      <div className="px-6 mt-4 space-y-3">
        {/* Members summary */}
        {people.length > 0 && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }}>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3 mt-4">
              Family Members ({people.length})
            </h2>
            <div className="space-y-2">
              {people.map((person, index) => {
            const fullName = person.last_name ? `${person.first_name} ${person.last_name}` : person.first_name;
            const isMe = person.user_id === user?.id;
            return <CozyCard key={person.id} className="py-3 cursor-pointer hover:shadow-cozy transition-all" onClick={() => handleEditPerson(person)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-primary-foreground font-semibold ${person.status === 'active' ? index % 4 === 0 ? "bg-primary" : index % 4 === 1 ? "bg-secondary" : index % 4 === 2 ? "bg-accent text-accent-foreground" : "bg-teal text-teal-foreground" : "bg-muted text-muted-foreground"}`}>
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          person.first_name[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {fullName}
                          {isMe && <span className="text-primary ml-2 text-sm">(You)</span>}
                        </p>
                        {person.status !== 'active' && <span className={`text-xs ${person.status === 'invited' ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                            {person.status === 'invited' ? 'Invited' : 'Pending'}
                          </span>}
                      </div>
                    </div>
                  </CozyCard>;
          })}
            </div>
          </motion.div>}
      </div>


      {/* Edit person modal */}
      {editingPerson && <EditPersonModal person={editingPerson} onClose={() => setEditingPerson(null)} onSave={handleSavePerson} />}

      {/* Add relative modal */}
      {addingRelative && <AddRelativeModal fromPerson={addingRelative.fromPerson} relationType={addingRelative.type} onClose={() => setAddingRelative(null)} onAdd={handleAddRelativeSubmit} />}

      {/* Invite person modal */}
      {invitingPerson && <InviteModal person={invitingPerson} onClose={() => setInvitingPerson(null)} onGenerateCode={generateInvite} />}

      {/* Create self node modal */}
      {showCreateSelf && <CreateSelfNodeModal onClose={() => setShowCreateSelf(false)} onCreate={handleCreateSelf} />}

      <BottomNav />
    </MobileLayout>;
};
export default Family;