import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Level, LevelStatus } from '../types';
import LevelNode from './LevelNode';
import CurvedRailwayPath from './CurvedRailwayPath.tsx';
import MovingCharacter from './MovingCharacter';
import ProgressBar from './ProgressBar';
import LevelTooltip from './LevelTooltip';
import SoundManager from './SoundManager';
import AboutModal from './AboutModal';
import { Info, Volume2, VolumeX } from 'lucide-react';

const LevelMap: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [hoveredLevel, setHoveredLevel] = useState<Level | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<number | null>(null);
  const [soundTriggers, setSoundTriggers] = useState({
    levelComplete: false,
    levelUnlock: false,
  });
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [logoPosition, setLogoPosition] = useState({ x: 15, y: 85 });
  const [partialProgress, setPartialProgress] = useState(0); // 0..1 progress between current and next level while moving

  // Define level positions along the curved path (Candy Crush style)
  const levelData = useMemo(() => [
    { id: 1, x: 15, y: 85, difficulty: 'Easy' as const, stars: 1, description: 'Welcome! Start your journey here.', color: 'from-pink-400 to-pink-600' },
    { id: 2, x: 50, y: 65, difficulty: 'Easy' as const, stars: 1, description: 'Learn the basics with simple challenges.', color: 'from-blue-400 to-blue-600' },
    { id: 3, x: 85, y: 55, difficulty: 'Easy' as const, stars: 2, description: 'Getting warmed up? Try some combos!', color: 'from-purple-400 to-purple-600' },
    { id: 4, x: 50, y: 45, difficulty: 'Medium' as const, stars: 2, description: 'Things are heating up now!', color: 'from-yellow-400 to-yellow-600' },
    { id: 5, x: 15, y: 35, difficulty: 'Medium' as const, stars: 2, description: 'Strategic thinking required.', color: 'from-green-400 to-green-600' },
    { id: 6, x: 50, y: 25, difficulty: 'Medium' as const, stars: 2, description: 'Complex patterns await you.', color: 'from-orange-400 to-orange-600' },
    { id: 7, x: 85, y: 15, difficulty: 'Hard' as const, stars: 3, description: 'Expert level challenges ahead!', color: 'from-red-400 to-red-600' },
  ], []);

  const levels: Level[] = useMemo(() => 
    levelData.map(data => ({
      ...data,
      position: { x: data.x, y: data.y },
      isCompleted: completedLevels.includes(data.id),
      isUnlocked: data.id <= currentLevel,
      isCurrent: data.id === currentLevel,
    })),
    [levelData, currentLevel, completedLevels]
  );

  const totalSegments = 6; // between 7 levels
  // Overall path progress across all segments: completed full segments + partial while moving
  const pathProgress = useMemo(() => {
    const completedSegments = Math.max(0, currentLevel - 1); // segments completed end-to-start
    const base = completedSegments / totalSegments;
    return Math.min(1, base + (partialProgress / totalSegments));
  }, [currentLevel, partialProgress]);

  const getLevelStatus = useCallback((level: Level): LevelStatus => {
    if (level.isCompleted) return LevelStatus.COMPLETED;
    if (level.isCurrent) return LevelStatus.CURRENT;
    if (level.isUnlocked) return LevelStatus.UNLOCKED;
    return LevelStatus.LOCKED;
  }, []);

  const handleLevelClick = useCallback((levelId: number) => {
    if (levelId <= currentLevel && !completedLevels.includes(levelId)) {
      window.location.href = `level${levelId}.html`;
    }
  }, [currentLevel, completedLevels]);

  const handleNext = useCallback(() => {
    if (currentLevel <= 7) {
      if (currentLevel < 7) {
        setIsMoving(true);
        const currentPos = levels.find(l => l.id === currentLevel)?.position || { x: 15, y: 85 };
        const nextPos = levels.find(l => l.id === currentLevel + 1)?.position || { x: 15, y: 85 };
        const startTime = Date.now();
        const duration = 2000; // faster to reduce perceived lag
        const animateLogo = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          setPartialProgress(easeProgress);
          const currentX = currentPos.x + (nextPos.x - currentPos.x) * easeProgress;
          const currentY = currentPos.y + (nextPos.y - currentPos.y) * easeProgress;
          setLogoPosition({ x: currentX, y: currentY });
          if (progress < 1) {
            requestAnimationFrame(animateLogo);
          } else {
            // Movement finished: now mark level completed and advance
            setCompletedLevels(prev => Array.from(new Set([...prev, currentLevel])));
            setSoundTriggers(prev => ({ ...prev, levelComplete: true }));
            setCurrentLevel(prev => prev + 1);
            setShowUnlockAnimation(currentLevel + 1);
            setSoundTriggers(prev => ({ ...prev, levelUnlock: true }));
            setIsMoving(false);
            setPartialProgress(0);
            setLogoPosition(nextPos);
            setTimeout(() => {
              setShowUnlockAnimation(null);
            }, 600);
          }
        };
        requestAnimationFrame(animateLogo);
      }
    }
  }, [currentLevel, levels]);

  const handleReset = useCallback(() => {
    setCurrentLevel(1);
    setCompletedLevels([]);
    setHoveredLevel(null);
    setIsMoving(false);
    setShowUnlockAnimation(null);
    setPartialProgress(0);
    setLogoPosition({ x: 15, y: 85 });
    for (let i = 1; i <= 7; i++) {
      localStorage.removeItem(`level${i}Completed`);
    }
  }, []);

  const handleLevelHover = useCallback((level: Level | null, position: { x: number; y: number }) => {
    setHoveredLevel(level);
    setTooltipPosition(position);
  }, []);

  const resetSoundTriggers = useCallback(() => {
    setSoundTriggers({ levelComplete: false, levelUnlock: false });
  }, []);

  useEffect(() => {
    const completed = [] as number[];
    for (let i = 1; i <= 7; i++) {
      if (localStorage.getItem(`level${i}Completed`) === 'true') {
        completed.push(i);
      }
    }
    setCompletedLevels(completed);
    const nextLevel = completed.length + 1;
    if (nextLevel <= 7) {
      setCurrentLevel(nextLevel);
      const levelPos = levelData.find(l => l.id === nextLevel);
      if (levelPos) {
        setLogoPosition({ x: levelPos.x, y: levelPos.y });
      }
    } else {
      const lastLevel = levelData.find(l => l.id === 7);
      if (lastLevel) {
        setLogoPosition({ x: lastLevel.x, y: lastLevel.y });
      }
    }
  }, [levelData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n') {
        handleNext();
      } else if (e.key.toLowerCase() === 'r') {
        handleReset();
      } else if (e.key.toLowerCase() === 'a') {
        setIsAboutOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handleReset]);

  const allLevelsCompleted = completedLevels.length === 7;
  const currentLevelPosition = logoPosition;

  return (
    <div className="min-h-screen text-white p-4" style={{
      backgroundImage: 'url("./treasure map.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <SoundManager
        onLevelComplete={!isMuted && soundTriggers.levelComplete}
        onLevelUnlock={!isMuted && soundTriggers.levelUnlock}
        onReset={resetSoundTriggers}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted((v) => !v)}
              className="p-3 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              aria-label={isMuted ? 'Unmute sounds (M)' : 'Mute sounds (M)'}
              title="Toggle sound (M)"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-3 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              aria-label="Open About (A)"
              title="About (A)"
            >
              <Info size={18} />
            </button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <ProgressBar
          currentLevel={currentLevel}
          completedLevels={completedLevels}
          totalLevels={7}
        />

        {/* Level Map Container */}
        <motion.div
          className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/30"
          style={{ minHeight: '700px' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Curved Railway Path */}
          <CurvedRailwayPath 
            levels={levels}
            currentLevel={currentLevel}
            progress={pathProgress}
          />

          {/* Moving Character */}
          <MovingCharacter 
            position={currentLevelPosition}
            isMoving={isMoving}
          />

          {/* Level Nodes */}
          <AnimatePresence>
            {levels.map((level) => (
              <LevelNode
                key={level.id}
                level={level}
                status={getLevelStatus(level)}
                onClick={handleLevelClick}
                onHover={handleLevelHover}
                showUnlockAnimation={showUnlockAnimation === level.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Tooltip */}
        <LevelTooltip
          level={hoveredLevel}
          isVisible={hoveredLevel !== null}
          position={tooltipPosition}
        />

        {/* Control Buttons */}
        <motion.div
          className="flex justify-center gap-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {!allLevelsCompleted ? (
            <motion.button
              onClick={handleNext}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 
                         text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-green-500/30
                         transform transition-all duration-200 hover:scale-105 active:scale-95 
                         disabled:opacity-50 disabled:cursor-not-allowed border border-green-400
                         backdrop-blur-sm"
              disabled={currentLevel > 7}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentLevel === 7 && completedLevels.includes(7) ? 'All Complete!' : 'Next Level'}
            </motion.button>
          ) : (
            <motion.div
              className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-white text-2xl font-bold mb-4">Congratulations!</p>
              <p className="text-white text-lg mb-6">You've completed all levels!</p>
            </motion.div>
          )}
          
          <motion.button
            onClick={handleReset}
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 
                       text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-blue-500/30
                       transform transition-all duration-200 hover:scale-105 active:scale-95 
                       border border-blue-400 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset Progress
          </motion.button>
        </motion.div>

        {/* About Modal */}
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </div>
    </div>
  );
};

export default LevelMap;