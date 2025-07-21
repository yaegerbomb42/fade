import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createGradient = (ctx, time) => {
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3 + Math.sin(time * 0.001) * 200,
        canvas.height * 0.4 + Math.cos(time * 0.0015) * 150,
        0,
        canvas.width * 0.7,
        canvas.height * 0.6,
        Math.max(canvas.width, canvas.height)
      );

      // Deep space colors with shifting hues
      const hue1 = 240 + Math.sin(time * 0.0008) * 30; // Blue to purple range
      const hue2 = 280 + Math.cos(time * 0.0012) * 40; // Purple to magenta range
      const hue3 = 200 + Math.sin(time * 0.0006) * 20; // Deep blue range

      gradient.addColorStop(0, `hsla(${hue1}, 70%, 15%, 1)`);
      gradient.addColorStop(0.3, `hsla(${hue2}, 60%, 12%, 0.9)`);
      gradient.addColorStop(0.6, `hsla(${hue3}, 80%, 8%, 0.8)`);
      gradient.addColorStop(1, `hsla(220, 90%, 5%, 1)`);

      return gradient;
    };

    const animate = () => {
      time += 32; // Slower animation for better performance
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create and apply animated gradient
      const gradient = createGradient(ctx, time);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle nebula effects - reduced for performance
      ctx.globalCompositeOperation = 'screen';
      
      // Reduced floating orbs for better performance
      for (let i = 0; i < 2; i++) {
        const orbGradient = ctx.createRadialGradient(
          canvas.width * (0.3 + i * 0.4) + Math.sin(time * 0.0005 + i) * 100,
          canvas.height * (0.4 + i * 0.2) + Math.cos(time * 0.0007 + i) * 80,
          0,
          canvas.width * (0.3 + i * 0.4),
          canvas.height * (0.4 + i * 0.2),
          200 + i * 50
        );

        const orbHue = 260 + i * 40 + Math.sin(time * 0.001) * 20;
        orbGradient.addColorStop(0, `hsla(${orbHue}, 80%, 30%, 0.08)`); // Reduced opacity
        orbGradient.addColorStop(0.5, `hsla(${orbHue}, 70%, 20%, 0.04)`);
        orbGradient.addColorStop(1, `hsla(${orbHue}, 60%, 10%, 0)`);

        ctx.fillStyle = orbGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalCompositeOperation = 'source-over';
      
      // Throttle animation to 30fps for better performance
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 33);
    };

    resizeCanvas();
    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-background"
      style={{ background: 'var(--color-background)' }}
    />
  );
};

export default AnimatedBackground;