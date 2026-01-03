import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { User, Plus, Mail, Edit2 } from 'lucide-react';
import { Person, PersonNodeData } from '@/types/family';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
  active: 'bg-secondary border-secondary',
  invited: 'bg-accent border-accent',
  placeholder: 'bg-muted border-muted-foreground/30',
  deceased: 'bg-muted/50 border-muted-foreground/20',
};

const statusTextColors: Record<string, string> = {
  active: 'text-secondary-foreground',
  invited: 'text-accent-foreground',
  placeholder: 'text-muted-foreground',
  deceased: 'text-muted-foreground/50',
};

interface PersonNodeProps {
  data: PersonNodeData;
}

function PersonNode({ data }: PersonNodeProps) {
  const { person, isCurrentUser, canEdit, onEdit, onAddRelative, onInvite } = data;
  const fullName = person.last_name 
    ? `${person.first_name} ${person.last_name}` 
    : person.first_name;

  const initials = person.first_name[0].toUpperCase() + 
    (person.last_name ? person.last_name[0].toUpperCase() : '');

  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="!bg-yarn-brown !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-yarn-brown !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-yarn-brown !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-yarn-brown !w-2 !h-2" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative cursor-pointer
              flex flex-col items-center gap-1
              p-3 rounded-2xl
              border-2 ${statusColors[person.status]}
              bg-card shadow-cozy
              min-w-[80px]
              transition-shadow hover:shadow-lifted
              ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''}
            `}
          >
            {/* Avatar */}
            <div className={`
              w-12 h-12 rounded-full 
              flex items-center justify-center
              ${statusColors[person.status]}
              ${statusTextColors[person.status]}
            `}>
              {person.avatar_url ? (
                <img 
                  src={person.avatar_url} 
                  alt={fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">{initials}</span>
              )}
            </div>

            {/* Name */}
            <p className={`
              text-xs font-semibold text-center leading-tight
              max-w-[70px] truncate
              ${statusTextColors[person.status]}
            `}>
              {fullName}
            </p>

            {/* Status badge */}
            {person.status === 'placeholder' && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                Pending
              </span>
            )}
            {person.status === 'invited' && (
              <span className="text-[10px] text-accent-foreground bg-accent px-1.5 py-0.5 rounded-full">
                Invited
              </span>
            )}

            {/* Current user indicator */}
            {isCurrentUser && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-primary-foreground" />
              </span>
            )}
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-48">
          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit(person)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
          )}

          {(person.status === 'placeholder' || person.status === 'invited') && canEdit && (
            <DropdownMenuItem onClick={() => onInvite(person)}>
              <Mail className="w-4 h-4 mr-2" />
              {person.status === 'invited' ? 'View Invite Code' : 'Send Invite'}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onAddRelative(person, 'parent')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Parent
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRelative(person, 'spouse')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Spouse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRelative(person, 'child')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default memo(PersonNode);
