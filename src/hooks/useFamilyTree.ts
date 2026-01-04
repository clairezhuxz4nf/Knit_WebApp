import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, Relationship, FamilyInvite, RelationshipType, PersonStatus } from '@/types/family';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useFamilyTree(familySpaceId: string | null) {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserPerson, setCurrentUserPerson] = useState<Person | null>(null);

  const fetchData = useCallback(async () => {
    if (!familySpaceId || !user) return;

    setLoading(true);
    try {
      // Fetch people
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('family_space_id', familySpaceId);

      if (peopleError) throw peopleError;

      // Fetch relationships
      const { data: relData, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .eq('family_space_id', familySpaceId);

      if (relError) throw relError;

      // Cast the data to proper types
      const typedPeople = (peopleData || []).map(p => ({
        ...p,
        status: p.status as PersonStatus
      })) as Person[];

      const typedRelationships = (relData || []).map(r => ({
        ...r,
        relationship_type: r.relationship_type as RelationshipType
      })) as Relationship[];

      setPeople(typedPeople);
      setRelationships(typedRelationships);

      // Find current user's person node
      const userPerson = typedPeople.find(p => p.user_id === user.id);
      setCurrentUserPerson(userPerson || null);
    } catch (error) {
      console.error('Error fetching family tree:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family tree.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [familySpaceId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create the current user's person node if it doesn't exist
  const createSelfNode = useCallback(async (firstName: string, lastName?: string) => {
    if (!familySpaceId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('people')
        .insert({
          family_space_id: familySpaceId,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName || null,
          status: 'active' as PersonStatus,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const typedPerson = { ...data, status: data.status as PersonStatus } as Person;
      setPeople(prev => [...prev, typedPerson]);
      setCurrentUserPerson(typedPerson);
      return typedPerson;
    } catch (error) {
      console.error('Error creating self node:', error);
      toast({
        title: 'Error',
        description: 'Failed to create your profile.',
        variant: 'destructive',
      });
      return null;
    }
  }, [familySpaceId, user]);

  // Add a relative (creates placeholder node and relationship)
  const addRelative = useCallback(async (
    fromPerson: Person,
    relationType: 'parent' | 'child' | 'spouse',
    placeholderName: string
  ) => {
    if (!familySpaceId || !user) return null;

    try {
      // Create placeholder person
      const { data: newPerson, error: personError } = await supabase
        .from('people')
        .insert({
          family_space_id: familySpaceId,
          first_name: placeholderName,
          status: 'placeholder' as PersonStatus,
          created_by: user.id,
        })
        .select()
        .single();

      if (personError) throw personError;

      // Create relationship
      let personAId: string;
      let personBId: string;
      let relationshipType: RelationshipType;

      if (relationType === 'parent') {
        // New person is parent of fromPerson
        personAId = newPerson.id;
        personBId = fromPerson.id;
        relationshipType = 'parent_child';
      } else if (relationType === 'child') {
        // fromPerson is parent of new person
        personAId = fromPerson.id;
        personBId = newPerson.id;
        relationshipType = 'parent_child';
      } else {
        // Spouse/partnership
        personAId = fromPerson.id;
        personBId = newPerson.id;
        relationshipType = 'partnership';
      }

      const { data: newRel, error: relError } = await supabase
        .from('relationships')
        .insert({
          family_space_id: familySpaceId,
          relationship_type: relationshipType,
          person_a_id: personAId,
          person_b_id: personBId,
        })
        .select()
        .single();

      if (relError) throw relError;

      const typedPerson = { ...newPerson, status: newPerson.status as PersonStatus } as Person;
      const typedRel = { ...newRel, relationship_type: newRel.relationship_type as RelationshipType } as Relationship;

      setPeople(prev => [...prev, typedPerson]);
      setRelationships(prev => [...prev, typedRel]);

      toast({
        title: 'Added!',
        description: `${placeholderName} has been added to the tree.`,
      });

      return typedPerson;
    } catch (error) {
      console.error('Error adding relative:', error);
      toast({
        title: 'Error',
        description: 'Failed to add family member.',
        variant: 'destructive',
      });
      return null;
    }
  }, [familySpaceId, user]);

  // Update a person's details
  const updatePerson = useCallback(async (
    personId: string,
    updates: Partial<Pick<Person, 'first_name' | 'last_name' | 'birth_date' | 'avatar_url'>>
  ) => {
    try {
      const { error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', personId);

      if (error) throw error;

      // Find the person to check if it's the current user
      const person = people.find(p => p.id === personId);
      
      // If this is the current user's node, sync to profiles
      if (person?.user_id && person.user_id === user?.id) {
        const fullName = updates.last_name 
          ? `${updates.first_name} ${updates.last_name}`
          : updates.first_name;

        // Sync to profiles table (including avatar)
        await supabase
          .from('profiles')
          .update({
            display_name: fullName || null,
            birthday: updates.birth_date || null,
            avatar_url: updates.avatar_url ?? undefined,
          })
          .eq('id', user.id);
      }

      setPeople(prev => prev.map(p => 
        p.id === personId ? { ...p, ...updates } : p
      ));

      toast({
        title: 'Updated!',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [people, user]);

  // Generate invite code for a placeholder
  const generateInvite = useCallback(async (targetPersonId: string): Promise<string | null> => {
    if (!familySpaceId || !user) return null;

    try {
      // Generate code using database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invite_code');

      if (codeError) throw codeError;

      // Create invite record
      const { data: invite, error: inviteError } = await supabase
        .from('family_invites')
        .insert({
          family_space_id: familySpaceId,
          target_person_id: targetPersonId,
          invite_code: codeData,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Update person status to invited
      await supabase
        .from('people')
        .update({ status: 'invited' as PersonStatus })
        .eq('id', targetPersonId);

      setPeople(prev => prev.map(p =>
        p.id === targetPersonId ? { ...p, status: 'invited' as PersonStatus } : p
      ));

      return invite.invite_code;
    } catch (error) {
      console.error('Error generating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invite code.',
        variant: 'destructive',
      });
      return null;
    }
  }, [familySpaceId, user]);

  // Get parents of a person
  const getParents = useCallback((personId: string) => {
    return relationships
      .filter(r => r.relationship_type === 'parent_child' && r.person_b_id === personId)
      .map(r => people.find(p => p.id === r.person_a_id))
      .filter(Boolean) as Person[];
  }, [relationships, people]);

  // Get children of a person
  const getChildren = useCallback((personId: string) => {
    return relationships
      .filter(r => r.relationship_type === 'parent_child' && r.person_a_id === personId)
      .map(r => people.find(p => p.id === r.person_b_id))
      .filter(Boolean) as Person[];
  }, [relationships, people]);

  // Get spouse/partner
  const getSpouse = useCallback((personId: string) => {
    const partnershipRel = relationships.find(
      r => r.relationship_type === 'partnership' &&
        (r.person_a_id === personId || r.person_b_id === personId)
    );
    if (!partnershipRel) return null;
    const partnerId = partnershipRel.person_a_id === personId 
      ? partnershipRel.person_b_id 
      : partnershipRel.person_a_id;
    return people.find(p => p.id === partnerId) || null;
  }, [relationships, people]);

  // Get siblings (share at least one parent)
  const getSiblings = useCallback((personId: string) => {
    const parents = getParents(personId);
    if (parents.length === 0) return [];

    const siblingIds = new Set<string>();
    parents.forEach(parent => {
      const children = getChildren(parent.id);
      children.forEach(child => {
        if (child.id !== personId) {
          siblingIds.add(child.id);
        }
      });
    });

    return Array.from(siblingIds)
      .map(id => people.find(p => p.id === id))
      .filter(Boolean) as Person[];
  }, [getParents, getChildren, people]);

  return {
    people,
    relationships,
    loading,
    currentUserPerson,
    createSelfNode,
    addRelative,
    updatePerson,
    generateInvite,
    getParents,
    getChildren,
    getSpouse,
    getSiblings,
    refetch: fetchData,
  };
}
