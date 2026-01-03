// Family tree types based on relational database schema

export type PersonStatus = 'active' | 'invited' | 'placeholder' | 'deceased';
export type RelationshipType = 'parent_child' | 'partnership';

export interface Person {
  id: string;
  family_space_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  status: PersonStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  family_space_id: string;
  relationship_type: RelationshipType;
  person_a_id: string; // For parent_child: parent; For partnership: either partner
  person_b_id: string; // For parent_child: child; For partnership: other partner
  created_at: string;
}

export interface FamilyInvite {
  id: string;
  family_space_id: string;
  target_person_id: string;
  invite_code: string;
  invited_by: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  created_at: string;
}

// Derived relationship for UI
export interface DerivedRelation {
  personId: string;
  relation: 'parent' | 'child' | 'spouse' | 'sibling';
  name: string;
}
