import React, { useState, useEffect } from 'react';

const BubbleLoading = ({ size = 64, speed = 1 }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 60 }, (_, i) => ({
        id: i,
        size: Math.random() * 5 + 1,
        distance: Math.random() * 80 + 20,
        angle: Math.random() * 360,
        speed: (Math.random() * 4000 + 1000) / speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        type: Math.random() > 0.7 ? 'sucking' : 'orbiting'
      }));
    };
    
    setParticles(generateParticles());
  }, [speed]);

  return (
    <div className={`relative flex items-center justify-center w-${size} h-${size}`}>
      
      {/* Ponto central */}
      <div className="absolute w-6 h-6 rounded-full bg-black border-2 border-[#324376]/60 z-10" />
      
      {/* Brilho central */}
      <div className="absolute w-8 h-8 rounded-full bg-[#324376]/30 animate-pulse" />
      
      {/* Partículas */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-[#324376]"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: particle.type === 'orbiting' 
              ? `orbit${particle.direction > 0 ? 'Clockwise' : 'Counter'} ${particle.speed}ms linear infinite`
              : `suck ${(Math.random() * 1000 + 500) / speed}ms ease-in infinite`,
            '--distance': `${particle.distance}px`,
            '--start-angle': `${particle.angle}deg`,
            '--start-x': `${(Math.random() - 0.5) * 150}px`,
            '--start-y': `${(Math.random() - 0.5) * 150}px`,
            opacity: particle.type === 'sucking' ? 0.8 : 0.6
          }}
        />
      ))}

      <style jsx>{`
        @keyframes orbitClockwise {
          0% {
            transform: 
              translate(-50%, -50%)
              rotate(var(--start-angle))
              translateX(var(--distance))
              rotate(calc(var(--start-angle) * -1));
          }
          100% {
            transform: 
              translate(-50%, -50%)
              rotate(calc(var(--start-angle) + 360deg))
              translateX(var(--distance))
              rotate(calc(var(--start-angle) * -1 - 360deg));
          }
        }
        
        @keyframes orbitCounter {
          0% {
            transform: 
              translate(-50%, -50%)
              rotate(var(--start-angle))
              translateX(var(--distance))
              rotate(calc(var(--start-angle) * -1));
          }
          100% {
            transform: 
              translate(-50%, -50%)
              rotate(calc(var(--start-angle) - 360deg))
              translateX(var(--distance))
              rotate(calc(var(--start-angle) * -1 + 360deg));
          }
        }
        
        @keyframes suck {
          0% {
            transform: 
              translate(-50%, -50%)
              translate(var(--start-x), var(--start-y));
            opacity: 0.8;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BubbleLoading;