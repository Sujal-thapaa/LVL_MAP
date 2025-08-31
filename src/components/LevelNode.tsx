import React from 'react';
import { motion } from 'framer-motion';
import { Level, LevelStatus } from '../types';
import { Check, Lock, Star } from 'lucide-react';

interface LevelNodeProps {
  level: Level;
  onClick: (levelId: number) => void;
  status: LevelStatus;
  onHover: (level: Level | null, position: { x: number; y: number }) => void;
  showUnlockAnimation: boolean;
}

const LevelNode: React.FC<LevelNodeProps> = ({ level, onClick, status, onHover, showUnlockAnimation }) => {
  const getStatusStyles = () => {
    switch (status) {
      case LevelStatus.COMPLETED:
        return {
          bg: 'bg-gradient-to-br from-green-500 to-green-700',
          border: 'border-green-400',
          text: 'text-white',
          shadow: 'shadow-lg shadow-green-500/30',
          cursor: 'cursor-pointer',
          glow: 'shadow-green-500/50',
        };
      case LevelStatus.CURRENT:
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
          border: 'border-yellow-300',
          text: 'text-white',
          shadow: 'shadow-xl shadow-yellow-500/40',
          cursor: 'cursor-pointer',
          glow: 'shadow-yellow-500/60',
        };
      case LevelStatus.UNLOCKED:
        // Use the level's distinct color
        const colorClass = (level as any).color || 'from-blue-500 to-blue-700';
        return {
          bg: `bg-gradient-to-br ${colorClass}`,
          border: 'border-white/30',
          text: 'text-white',
          shadow: 'shadow-lg shadow-blue-500/30',
          cursor: 'cursor-pointer',
          glow: 'shadow-blue-500/40',
        };
      case LevelStatus.LOCKED:
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-600 to-gray-800',
          border: 'border-gray-500',
          text: 'text-gray-400',
          shadow: 'shadow-md shadow-gray-800/50',
          cursor: 'cursor-not-allowed',
          glow: 'shadow-gray-800/30',
        };
    }
  };

  const styles = getStatusStyles();
  const isClickable = status !== LevelStatus.LOCKED;

  const handleClick = () => {
    if (isClickable) {
      onClick(level.id);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isClickable) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(level, { x: rect.left + rect.width / 2, y: rect.top });
    }
  };

  const handleMouseLeave = () => {
    onHover(null, { x: 0, y: 0 });
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const isFilled = i < level.stars;
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${
            isFilled 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-400'
          } transition-colors duration-200`}
        />
      );
    }
    return stars;
  };

  const renderContent = () => {
    if (status === LevelStatus.LOCKED) {
      return <Lock size={20} className="text-gray-400" />;
    }
    return <span className={`${styles.text} font-bold text-xl`}>{level.id}</span>;
  };

  return (
    <div className="absolute" style={{
      left: `${level.position.x}%`,
      top: `${level.position.y}%`,
      transform: 'translate(-50%, -50%)',
    }}>
      {/* Level Circle */}
      <motion.div
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          border-4 ${styles.bg} ${styles.border} ${styles.shadow} ${styles.cursor}
          transition-all duration-300 z-10 relative
        `}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={isClickable ? { scale: 1.1 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: level.id * 0.1,
        }}
      >
        {renderContent()}
        
        {/* Unlock animation */}
        {showUnlockAnimation && (
          <>
            <motion.div
              className="absolute -inset-4 rounded-full border-4 border-yellow-400"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute -inset-2 rounded-full bg-yellow-400/20"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            />
          </>
        )}
        
        {/* Current level pulsing ring */}
        {status === LevelStatus.CURRENT && (
          <motion.div
            className="absolute -inset-3 rounded-full border-4 border-yellow-300"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.8, 0.3, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Enhanced glow effect for unlocked levels */}
        {status === LevelStatus.UNLOCKED && (
          <motion.div
            className={`absolute -inset-1 rounded-full ${styles.glow}`}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* Stars below the level circle - only show after completion */}
      {status === LevelStatus.COMPLETED && (
        <motion.div
          className="flex justify-center gap-1 mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: level.id * 0.1 + 0.3,
            duration: 0.5,
          }}
        >
          {renderStars()}
        </motion.div>
      )}
    </div>
  );
};

export default LevelNode;