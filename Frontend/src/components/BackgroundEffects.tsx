import { useEffect, useRef } from "react";

export function BackgroundEffects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.setProperty("--mouse-x", `${e.clientX}px`);
          containerRef.current.style.setProperty("--mouse-y", `${e.clientY}px`);
          containerRef.current.style.setProperty("--spotlight-opacity", "1");
        }
      });
    };

    const handleMouseLeave = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty("--spotlight-opacity", "0");
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "40%",
        "--spotlight-opacity": "1"
      } as React.CSSProperties}
    >
      {/* 1. Base Ambient Dark Grid (Faintly visible across deep space) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 30%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 30%, transparent 90%)"
        }}
      />

      {/* 2. Interactive Spotlight Cursor Grid (Gentle white grid following mouse) */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 1)",
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 40%), black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 40%), black 0%, transparent 100%)"
        }}
      />

      {/* 3. Soft Cursor Flashlight Beam (Subtle ambient aura centered on cursor) */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 1)",
          background: "radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 40%), rgba(255, 255, 255, 0.025), transparent 70%)"
        }}
      />

      {/* 4. Top-Left Cyan Ambient Nebula with Blooming Glow (Solo AI Aura) */}
      <div 
        className="absolute -top-28 -left-28 h-[550px] w-[550px] rounded-full bg-cyan-500/16 animate-nebula-bloom-1"
      />

      {/* 5. Bottom-Right Emerald Ambient Nebula with Blooming Glow (Online Match Aura) */}
      <div 
        className="absolute -bottom-28 -right-28 h-[600px] w-[600px] rounded-full bg-emerald-500/16 animate-nebula-bloom-2"
      />

      {/* 6. Top-Center Soft Horizon Indigo Glow */}
      <div 
        className="absolute -top-36 left-1/2 -translate-x-1/2 h-[380px] w-[850px] rounded-full bg-indigo-600/12 animate-nebula-bloom-3"
      />

      {/* 7. Center Play-Area Grounding Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[750px] rounded-full bg-cyan-950/25 blur-[160px]"
      />
    </div>
  );
}
