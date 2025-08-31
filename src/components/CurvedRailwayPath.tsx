import React from 'react';
import { motion } from 'framer-motion';
import { Level } from '../types';

interface CurvedRailwayPathProps {
  levels: Level[];
  currentLevel: number;
  progress: number; // 0..1 progress along the full path for the red dashed overlay
}

const CurvedRailwayPath: React.FC<CurvedRailwayPathProps> = ({ levels, currentLevel, progress }) => {
  // Create a smooth curved path connecting all levels
  const createCurvedPath = () => {
    if (levels.length < 2) return '';
    
    const points = levels.map(level => ({ x: level.position.x, y: level.position.y }));
    
    // Start with the first point
    let path = `M ${points[0].x} ${points[0].y}`;
    
    // Create smooth curves between points with alternating directions
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      
      // Calculate the midpoint
      const midX = (prev.x + current.x) / 2;
      const midY = (prev.y + current.y) / 2;
      
      // Calculate the distance between points for curve intensity
      const distance = Math.sqrt(Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2));
      const curveIntensity = Math.min(distance * 0.15, 8); // Gentle curve, max 8 units
      
      // Alternate curve direction: even indices concave down, odd indices concave up
      const isEvenIndex = i % 2 === 0;
      const curveDirection = isEvenIndex ? 1 : -1;
      
      // Calculate control points with alternating curves
      const controlX1 = prev.x + (midX - prev.x) * 0.8;
      const controlY1 = prev.y + (midY - prev.y) * 0.8 + (curveDirection * curveIntensity);
      const controlX2 = current.x - (current.x - midX) * 0.8;
      const controlY2 = current.y - (current.y - midY) * 0.8 + (curveDirection * curveIntensity);
      
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${current.x} ${current.y}`;
    }
    
    return path;
  };

  const pathData = createCurvedPath();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Fixed, permanent black base path (never changes) */}
        <path
          d={pathData}
          stroke="#000000"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Single red dashed overlay showing cumulative progress */}
        <motion.path
          d={pathData}
          stroke="#DC2626"
          strokeWidth="0.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0, Math.min(1, progress)) }}
          transition={{ duration: 0 }}
        />
      </svg>
    </div>
  );
};

export default CurvedRailwayPath;
