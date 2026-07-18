'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollGradientBackground() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(1, Math.max(0, window.scrollY / totalHeight));
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute smooth color interpolation based on scroll position
  // 0% -> Cyan / Sky Blue (#e0f2fe)
  // 50% -> Clinical Emerald Mint (#d1fae5)
  // 100% -> Bio-Pharma Indigo / Slate (#e0e7ff)
  const getGradientStyle = () => {
    const hue1 = 195 + scrollProgress * 40; // 195 (Cyan) -> 235 (Indigo)
    const hue2 = 160 + scrollProgress * 30; // 160 (Emerald) -> 190 (Sky)

    return {
      background: `
        radial-gradient(circle at ${20 + scrollProgress * 60}% ${15 + scrollProgress * 50}%, hsla(${hue1}, 85%, 94%, 0.85) 0%, transparent 55%),
        radial-gradient(circle at ${80 - scrollProgress * 50}% ${60 - scrollProgress * 30}%, hsla(${hue2}, 80%, 92%, 0.85) 0%, transparent 60%),
        linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)
      `,
      transition: 'background 0.4s ease-out',
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        ...getGradientStyle(),
      }}
    >
      {/* Decorative ambient glowing healthcare blur orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `hsla(${195 + scrollProgress * 30}, 85%, 88%, 0.45)`,
          filter: 'blur(90px)',
          transition: 'transform 0.8s ease-out, background 0.5s ease',
          transform: `translateY(${scrollProgress * 180}px) scale(${1 + scrollProgress * 0.2})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `hsla(${160 + scrollProgress * 40}, 80%, 90%, 0.4)`,
          filter: 'blur(100px)',
          transition: 'transform 0.8s ease-out, background 0.5s ease',
          transform: `translateY(${-scrollProgress * 150}px) scale(${1.1 - scrollProgress * 0.15})`,
        }}
      />
    </div>
  );
}
