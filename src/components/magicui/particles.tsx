'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/utils';

interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Circle = {
  x: number; y: number; translateX: number; translateY: number;
  size: number; alpha: number; targetAlpha: number;
  dx: number; dy: number; magnetism: number;
};

export function Particles({
  className = '',
  quantity = 80,
  staticity = 50,
  ease = 50,
  size = 0.4,
  color = '#E50914',
  vx = 0,
  vy = 0,
  ...props
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const raf = useRef<number | null>(null);
  const rgb = hexToRgb(color);

  useEffect(() => {
    if (canvasRef.current) ctx.current = canvasRef.current.getContext('2d');
    init();
    animate();

    const onResize = () => init();
    const onMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      mouse.current.x = e.clientX - r.left - canvasSize.current.w / 2;
      mouse.current.y = e.clientY - r.top - canvasSize.current.h / 2;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  function init() {
    if (!containerRef.current || !canvasRef.current || !ctx.current) return;
    canvasSize.current.w = containerRef.current.offsetWidth;
    canvasSize.current.h = containerRef.current.offsetHeight;
    canvasRef.current.width = canvasSize.current.w * dpr;
    canvasRef.current.height = canvasSize.current.h * dpr;
    canvasRef.current.style.width = `${canvasSize.current.w}px`;
    canvasRef.current.style.height = `${canvasSize.current.h}px`;
    ctx.current.scale(dpr, dpr);
    circles.current = [];
    for (let i = 0; i < quantity; i++) circles.current.push(makeCircle());
  }

  function makeCircle(): Circle {
    return {
      x: Math.random() * canvasSize.current.w,
      y: Math.random() * canvasSize.current.h,
      translateX: 0, translateY: 0,
      size: Math.random() * 2 + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    };
  }

  function animate() {
    if (!ctx.current) return;
    ctx.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);

    circles.current.forEach((c, i) => {
      const edge = [
        c.x + c.translateX - c.size,
        canvasSize.current.w - c.x - c.translateX - c.size,
        c.y + c.translateY - c.size,
        canvasSize.current.h - c.y - c.translateY - c.size,
      ];
      const closest = Math.min(...edge);
      const remap = Math.max(0, Math.min(1, closest / 20));
      if (remap > 1) { c.alpha = Math.min(c.alpha + 0.02, c.targetAlpha); }
      else { c.alpha = c.targetAlpha * remap; }

      c.x += c.dx + vx;
      c.y += c.dy + vy;
      c.translateX += (mouse.current.x / (staticity / c.magnetism) - c.translateX) / ease;
      c.translateY += (mouse.current.y / (staticity / c.magnetism) - c.translateY) / ease;

      ctx.current!.save();
      ctx.current!.translate(c.translateX, c.translateY);
      ctx.current!.beginPath();
      ctx.current!.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.current!.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${c.alpha})`;
      ctx.current!.fill();
      ctx.current!.restore();

      if (c.x < -c.size || c.x > canvasSize.current.w + c.size || c.y < -c.size || c.y > canvasSize.current.h + c.size) {
        circles.current[i] = makeCircle();
      }
    });

    raf.current = requestAnimationFrame(animate);
  }

  return (
    <div className={cn('pointer-events-none', className)} ref={containerRef} aria-hidden="true" {...props}>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
