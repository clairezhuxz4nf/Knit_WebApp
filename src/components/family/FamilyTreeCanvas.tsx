import { useMemo } from 'react';
import { Person, Relationship } from '@/types/family';
import { useAuth } from '@/contexts/AuthContext';
import TreeNode from './TreeNode';

interface FamilyTreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  currentUserPerson: Person | null;
  onEditPerson: (person: Person) => void;
  onAddRelative: (person: Person, type: 'parent' | 'child' | 'spouse') => void;
  onInvitePerson: (person: Person) => void;
}

interface TreePerson extends Person {
  children: TreePerson[];
  spouse?: TreePerson;
}

export default function FamilyTreeCanvas({
  people,
  relationships,
  currentUserPerson,
  onEditPerson,
  onAddRelative,
  onInvitePerson,
}: FamilyTreeCanvasProps) {
  const { user } = useAuth();

  // Build hierarchical tree structure from flat data
  const { rootNodes, canEditPerson } = useMemo(() => {
    if (people.length === 0) return { rootNodes: [], canEditPerson: () => false };

    // Helper to get children IDs for a person
    const getChildrenIds = (personId: string): string[] => {
      return relationships
        .filter(r => r.relationship_type === 'parent_child' && r.person_a_id === personId)
        .map(r => r.person_b_id);
    };

    // Helper to get spouse ID
    const getSpouseId = (personId: string): string | null => {
      const rel = relationships.find(
        r => r.relationship_type === 'partnership' &&
          (r.person_a_id === personId || r.person_b_id === personId)
      );
      if (!rel) return null;
      return rel.person_a_id === personId ? rel.person_b_id : rel.person_a_id;
    };

    // Find all people who are children (have parents)
    const childIds = new Set(
      relationships
        .filter(r => r.relationship_type === 'parent_child')
        .map(r => r.person_b_id)
    );

    // Root nodes are those with no parents
    let roots = people.filter(p => !childIds.has(p.id));
    if (roots.length === 0 && people.length > 0) {
      roots = [people[0]];
    }

    // Track processed to avoid infinite loops
    const processed = new Set<string>();

    // Recursively build tree
    const buildTree = (personId: string): TreePerson | null => {
      if (processed.has(personId)) return null;
      
      const person = people.find(p => p.id === personId);
      if (!person) return null;

      processed.add(personId);

      const childrenIds = getChildrenIds(personId);
      const children: TreePerson[] = [];

      childrenIds.forEach(childId => {
        const childTree = buildTree(childId);
        if (childTree) children.push(childTree);
      });

      // Get spouse
      const spouseId = getSpouseId(personId);
      let spouse: TreePerson | undefined;
      if (spouseId && !processed.has(spouseId)) {
        const spousePerson = people.find(p => p.id === spouseId);
        if (spousePerson) {
          processed.add(spouseId);
          spouse = { ...spousePerson, children: [] };
        }
      }

      return {
        ...person,
        children,
        spouse,
      };
    };

    // Build trees from all roots
    const trees: TreePerson[] = [];
    roots.forEach(root => {
      const tree = buildTree(root.id);
      if (tree) trees.push(tree);
    });

    // Can edit: own node, or placeholder connected to current user
    const canEditPerson = (person: Person): boolean => {
      if (person.user_id === user?.id) return true;
      if (person.status !== 'placeholder' && person.status !== 'invited') return false;
      if (!currentUserPerson) return false;
      return relationships.some(r =>
        (r.person_a_id === person.id && r.person_b_id === currentUserPerson.id) ||
        (r.person_b_id === person.id && r.person_a_id === currentUserPerson.id)
      );
    };

    return { rootNodes: trees, canEditPerson };
  }, [people, relationships, user, currentUserPerson]);

  if (rootNodes.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border-4 border-yarn-brown bg-card/80 shadow-lifted">
      <div className="w-full overflow-x-auto py-6 custom-scrollbar">
        <div className="inline-block min-w-full">
          <div className="tree flex justify-center">
            <ul className="flex justify-center pt-5 relative">
              {rootNodes.map(root => (
                <TreeNode
                  key={root.id}
                  person={root}
                  isCurrentUser={root.user_id === user?.id}
                  canEdit={canEditPerson(root)}
                  onEdit={onEditPerson}
                  onAddRelative={onAddRelative}
                  onInvite={onInvitePerson}
                  currentUserId={user?.id}
                  canEditPerson={canEditPerson}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CSS for tree connectors */}
      <style>{`
        .tree ul {
          padding-top: 20px;
          position: relative;
          transition: all 0.3s;
          display: flex;
          justify-content: center;
        }

        .tree li {
          float: left;
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 8px 0 8px;
          transition: all 0.3s;
        }

        /* Vertical line above node */
        .tree li::before, .tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid hsl(var(--yarn-brown));
          width: 50%;
          height: 20px;
        }

        .tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid hsl(var(--yarn-brown));
        }

        /* Remove connectors for single children */
        .tree li:only-child::after, .tree li:only-child::before {
          display: none;
        }
        .tree li:only-child {
          padding-top: 0;
        }

        /* Remove left connector from first child */
        .tree li:first-child::before {
          border: 0 none;
        }
        /* Remove right connector from last child */
        .tree li:last-child::after {
          border: 0 none;
        }
        .tree li:last-child::before {
          border-right: 2px solid hsl(var(--yarn-brown));
          border-radius: 0 5px 0 0;
        }
        .tree li:first-child::after {
          border-radius: 5px 0 0 0;
        }

        /* Downward connector from parent */
        .tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid hsl(var(--yarn-brown));
          width: 0;
          height: 20px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--yarn-brown));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--yarn-brown) / 0.8);
        }
      `}</style>
    </div>
  );
}
