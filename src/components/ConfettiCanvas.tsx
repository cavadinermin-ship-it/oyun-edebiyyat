import { useEffect, useRef } from "react";

export function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    const cols = ["#FF8A00", "#10C98F", "#9B6BFF", "#22B8F0", "#FF4D7E", "#FFC93C", "#ffffff"];
    const particles = Array.from({ length: 200 }, (_, i) => ({
      x: Math.random() * cv.width,
      y: -20 - Math.random() * cv.height * 0.6,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3.5,
      r: Math.random() * 6,
      vr: -0.2 + Math.random() * 0.4,
      c: cols[i % cols.length],
    }));

    const end = performance.now() + 4800;
    let rafId = 0;

    function frame(t: number) {
      if (!ctx || !cv) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of particles) {
        p.x += p.vx + Math.sin(p.y / 40);
        p.y += p.vy;
        p.r += p.vr;
        if (p.y > cv.height + 20 && t < end - 1600) {
          p.y = -20;
          p.x = Math.random() * cv.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < end) {
        rafId = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, cv.width, cv.height);
      }
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[70]"
      aria-hidden="true"
    />
  );
}
