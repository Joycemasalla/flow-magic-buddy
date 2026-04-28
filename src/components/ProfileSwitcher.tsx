import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSwitcherProps {
  mode: 'personal' | 'couple';
  onModeChange: (mode: 'personal' | 'couple') => void;
}

export default function ProfileSwitcher({ mode, onModeChange }: ProfileSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40">
      {/* Personal Option */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onModeChange('personal')}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm',
          mode === 'personal'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {mode === 'personal' && (
          <motion.div
            layoutId="profileSwitcher"
            className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/30"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <User className="w-4 h-4 stroke-[1.5] relative z-10" />
        <span className="relative z-10 hidden sm:inline">Minha</span>
      </motion.button>

      {/* Couple Option */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onModeChange('couple')}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm',
          mode === 'couple'
            ? 'text-accent'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {mode === 'couple' && (
          <motion.div
            layoutId="profileSwitcher"
            className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/30"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <Users className="w-4 h-4 stroke-[1.5] relative z-10" />
        <span className="relative z-10 hidden sm:inline">Nossa</span>
      </motion.button>
    </div>
  );
}
