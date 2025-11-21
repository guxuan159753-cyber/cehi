import React, { useEffect, useMemo } from 'react';
import { WheelItem } from '../types';

interface WheelProps {
  items: WheelItem[];
  rotation: number;
  isSpinning: boolean;
  onSpinEnd: () => void;
}

const Wheel: React.FC<WheelProps> = ({ items, rotation, isSpinning, onSpinEnd }) => {
  const radius = 400; // Internal SVG coordinate system radius
  const centerX = 400;
  const centerY = 400;

  // Helper to calculate coordinates on the circle
  const getCoordinatesForPercent = (percent: number) => {
    const x = centerX + radius * Math.cos(2 * Math.PI * percent);
    const y = centerY + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const segments = useMemo(() => {
    let cumulativePercent = 0;
    
    return items.map((item) => {
      const startPercent = cumulativePercent;
      const slicePercent = 1 / items.length;
      const endPercent = cumulativePercent + slicePercent;
      
      // Calculate path for the slice
      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(endPercent);
      
      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z'
      ].join(' ');

      // Calculate text position (middle of the slice, slightly inwards)
      const midPercent = startPercent + slicePercent / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + textRadius * Math.cos(2 * Math.PI * midPercent);
      const textY = centerY + textRadius * Math.sin(2 * Math.PI * midPercent);
      
      // Calculate text rotation to align with radius
      // Convert percent to degrees, add 90 because SVG text is horizontal by default
      // and we want it pointing outwards (or inwards).
      // 0 percent is at 3 o'clock (0 rads).
      const angleDeg = midPercent * 360; 
      
      // Flip text on the left side so it's readable
      const rotateText = angleDeg + (angleDeg > 90 && angleDeg < 270 ? 180 : 0);

      cumulativePercent += slicePercent;

      return {
        ...item,
        pathData,
        textX,
        textY,
        angleDeg,
        rotateText
      };
    });
  }, [items]);

  // Detect when transition ends to trigger callback
  useEffect(() => {
    if (!isSpinning) return;
    
    const timeout = setTimeout(() => {
      onSpinEnd();
    }, 5000); // Must match CSS transition duration

    return () => clearTimeout(timeout);
  }, [rotation, isSpinning, onSpinEnd]);

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto">
      {/* The Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white drop-shadow-lg filter"></div>
      </div>

      {/* The Wheel SVG */}
      <div 
        className="w-full h-full transition-transform duration-[5000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-transform drop-shadow-2xl rounded-full border-4 border-white/20"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg 
          viewBox="0 0 800 800" 
          className="w-full h-full transform -rotate-90" // Start 0 at top
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="2" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {segments.map((seg, i) => (
            <g key={seg.id}>
              <path 
                d={seg.pathData} 
                fill={seg.color} 
                stroke="white" 
                strokeWidth="2"
              />
              <text
                x={seg.textX}
                y={seg.textY}
                fill="white"
                fontSize="32"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${seg.rotateText}, ${seg.textX}, ${seg.textY})`}
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {seg.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* Center Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-slate-200">
        <div className="text-2xl">✨</div>
      </div>
    </div>
  );
};

export default Wheel;
