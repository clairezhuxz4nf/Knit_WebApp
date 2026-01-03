import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PersonNode from './PersonNode';
import { Person, Relationship, PersonNodeData } from '@/types/family';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyTreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  currentUserPerson: Person | null;
  onEditPerson: (person: Person) => void;
  onAddRelative: (person: Person, type: 'parent' | 'child' | 'spouse') => void;
  onInvitePerson: (person: Person) => void;
}

const nodeTypes = {
  person: PersonNode,
};

export default function FamilyTreeCanvas({
  people,
  relationships,
  currentUserPerson,
  onEditPerson,
  onAddRelative,
  onInvitePerson,
}: FamilyTreeCanvasProps) {
  const { user } = useAuth();

  const { initialNodes, initialEdges } = useMemo(() => {
    if (people.length === 0) return { initialNodes: [], initialEdges: [] };

    // Build parent-child hierarchy
    const childIds = new Set(
      relationships
        .filter(r => r.relationship_type === 'parent_child')
        .map(r => r.person_b_id)
    );

    // Find roots (no parents)
    let roots = people.filter(p => !childIds.has(p.id));
    if (roots.length === 0) roots = people.slice(0, 1);

    const nodePositions = new Map<string, { x: number; y: number }>();
    const processed = new Set<string>();

    const HORIZONTAL_SPACING = 140;
    const VERTICAL_SPACING = 130;

    function getChildren(personId: string): string[] {
      return relationships
        .filter(r => r.relationship_type === 'parent_child' && r.person_a_id === personId)
        .map(r => r.person_b_id);
    }

    function getSpouse(personId: string): string | null {
      const rel = relationships.find(
        r => r.relationship_type === 'partnership' &&
          (r.person_a_id === personId || r.person_b_id === personId)
      );
      if (!rel) return null;
      return rel.person_a_id === personId ? rel.person_b_id : rel.person_a_id;
    }

    // Process roots
    let rootX = 0;
    roots.forEach((root) => {
      nodePositions.set(root.id, { x: rootX, y: 0 });
      processed.add(root.id);

      const spouseId = getSpouse(root.id);
      if (spouseId && !processed.has(spouseId)) {
        nodePositions.set(spouseId, { x: rootX + HORIZONTAL_SPACING - 20, y: 0 });
        processed.add(spouseId);
        rootX += HORIZONTAL_SPACING * 2;
      } else {
        rootX += HORIZONTAL_SPACING;
      }
    });

    // Process children level by level
    let currentLevel = 0;
    let hasMore = true;
    
    while (hasMore) {
      hasMore = false;
      const currentLevelPeople = Array.from(nodePositions.entries())
        .filter(([, pos]) => pos.y === currentLevel * VERTICAL_SPACING)
        .map(([id]) => id);

      const nextLevelChildren: { id: string; parentX: number }[] = [];

      currentLevelPeople.forEach(parentId => {
        const children = getChildren(parentId);
        const parentPos = nodePositions.get(parentId)!;
        
        children.forEach(childId => {
          if (!processed.has(childId)) {
            nextLevelChildren.push({ id: childId, parentX: parentPos.x });
          }
        });
      });

      if (nextLevelChildren.length > 0) {
        hasMore = true;
        currentLevel++;

        // Center children under parents
        const avgX = nextLevelChildren.reduce((sum, c) => sum + c.parentX, 0) / nextLevelChildren.length;
        const startX = avgX - ((nextLevelChildren.length - 1) * HORIZONTAL_SPACING) / 2;

        nextLevelChildren.forEach((child, idx) => {
          if (!processed.has(child.id)) {
            nodePositions.set(child.id, {
              x: startX + idx * HORIZONTAL_SPACING,
              y: currentLevel * VERTICAL_SPACING
            });
            processed.add(child.id);

            // Position spouse
            const spouseId = getSpouse(child.id);
            if (spouseId && !processed.has(spouseId)) {
              nodePositions.set(spouseId, {
                x: startX + idx * HORIZONTAL_SPACING + HORIZONTAL_SPACING - 20,
                y: currentLevel * VERTICAL_SPACING
              });
              processed.add(spouseId);
            }
          }
        });
      }
    }

    // Position remaining unprocessed people
    people.forEach((p, idx) => {
      if (!nodePositions.has(p.id)) {
        nodePositions.set(p.id, {
          x: idx * HORIZONTAL_SPACING,
          y: (currentLevel + 1) * VERTICAL_SPACING
        });
      }
    });

    // Can edit: own node, or placeholder connected to you
    const canEditPerson = (person: Person): boolean => {
      if (person.user_id === user?.id) return true;
      if (person.status !== 'placeholder' && person.status !== 'invited') return false;
      // Check if connected to current user
      if (!currentUserPerson) return false;
      return relationships.some(r =>
        (r.person_a_id === person.id && r.person_b_id === currentUserPerson.id) ||
        (r.person_b_id === person.id && r.person_a_id === currentUserPerson.id)
      );
    };

    // Create nodes
    const nodes: Node[] = people.map(person => {
      const pos = nodePositions.get(person.id) || { x: 0, y: 0 };
      return {
        id: person.id,
        type: 'person',
        position: pos,
        data: {
          person,
          isCurrentUser: person.user_id === user?.id,
          canEdit: canEditPerson(person),
          onEdit: onEditPerson,
          onAddRelative,
          onInvite: onInvitePerson,
        } as PersonNodeData,
      };
    });

    // Create edges
    const edges: Edge[] = relationships.map(rel => ({
      id: rel.id,
      source: rel.person_a_id,
      target: rel.person_b_id,
      sourceHandle: rel.relationship_type === 'partnership' ? 'right' : undefined,
      targetHandle: rel.relationship_type === 'partnership' ? 'left' : undefined,
      type: 'smoothstep',
      style: {
        stroke: rel.relationship_type === 'partnership' 
          ? 'hsl(4, 31%, 66%)' // yarn-rose for partnership
          : 'hsl(25, 35%, 45%)', // yarn-brown for parent-child
        strokeWidth: 2,
      },
      animated: rel.relationship_type === 'partnership',
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [people, relationships, user, currentUserPerson, onEditPerson, onAddRelative, onInvitePerson]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[350px] rounded-2xl overflow-hidden border-4 border-yarn-brown bg-card/80 shadow-lifted">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(25, 35%, 45%)" gap={20} size={1} />
        <Controls 
          showInteractive={false}
          className="!bg-card !border-border !rounded-xl !shadow-soft"
        />
      </ReactFlow>
    </div>
  );
}
