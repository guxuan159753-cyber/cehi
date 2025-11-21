import React from 'react';

const Confetti: React.FC = () => {
  // Create fixed number of particles
  const particles = Array.from({ length: 50 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const animDelay = Math.random() * 2;
        const bg = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2'][Math.floor(Math.random() * 4)];
        
        return (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-sm animate-[fall_3s_linear_infinite]"
            style={{
              left: `${left}%`,
              top: '-5%',
              backgroundColor: bg,
              animationDelay: `${animDelay}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        );
      })}
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default Confetti;
