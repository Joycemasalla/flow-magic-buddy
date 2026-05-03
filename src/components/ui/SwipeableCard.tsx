import { useState, ReactNode } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
  /** Width in pixels of the action drawer revealed on swipe. */
  actionsWidth?: number;
  /** Optional custom actions; when provided, replaces the default Edit/Delete. */
  renderActions?: (close: () => void) => ReactNode;
}

/**
 * A horizontally-swipeable card that reveals action buttons on swipe-left.
 * Actions remain hidden when idle and never overlap the card content.
 */
export function SwipeableCard({
  children,
  onEdit,
  onDelete,
  onClick,
  className,
  actionsWidth = 100,
  renderActions,
}: SwipeableCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const x = useMotionValue(0);
  // Fade actions in only as the user swipes; hide completely when at rest.
  const actionsOpacity = useTransform(x, [-actionsWidth, -10, 0], [1, 0, 0]);
  const actionsPointerEvents = useTransform(x, (latest) =>
    latest < -20 ? 'auto' : 'none'
  );

  const close = () => setIsOpen(false);

  const handleDragStart = () => setHasDragged(false);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -actionsWidth * 0.6) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (hasDragged) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Actions layer (hidden when idle) */}
      <motion.div
        style={{ opacity: actionsOpacity, pointerEvents: actionsPointerEvents as never }}
        className="absolute right-0 top-0 bottom-0 flex items-center gap-1.5 pr-2.5 z-[1]"
      >
        {renderActions ? (
          renderActions(close)
        ) : (
          <>
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  close();
                }}
                className="h-10 w-10 bg-muted/70 hover:bg-muted rounded-xl"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4 stroke-[1.5]" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  close();
                }}
                className="h-10 w-10 bg-destructive/15 text-destructive hover:bg-destructive/25 rounded-xl"
                aria-label="Excluir"
              >
                <Trash2 className="w-4 h-4 stroke-[1.5]" />
              </Button>
            )}
          </>
        )}
      </motion.div>

      {/* Foreground card */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={0.08}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -actionsWidth : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={handleClick}
        className={cn(
          'relative z-[2] cursor-grab active:cursor-grabbing touch-pan-y',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeableCard;
