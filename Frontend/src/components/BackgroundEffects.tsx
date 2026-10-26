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
          background: "radial-gradient(circle 240px at var(--mouse-x, 50%) var(--mouse-y, 40%), rgba(56, 189, 248, 0.05), transparent 70%)"
        }}
      />

      {/* 4. Top-Left Cyan Ambient Nebula (Roaming Solo/Cyber Aura) */}
      <div 
        className="absolute -top-28 -left-28 h-[580px] w-[580px] rounded-full bg-gradient-to-br from-cyan-400/32 via-cyan-500/26 to-blue-500/18 animate-roam-glow-1"
      />

      {/* 5. Bottom-Right Emerald Ambient Nebula (Roaming Match/Jade Aura) */}
      <div 
        className="absolute -bottom-28 -right-28 h-[620px] w-[620px] rounded-full bg-gradient-to-tl from-emerald-400/32 via-emerald-500/26 to-teal-500/18 animate-roam-glow-2"
      />

      {/* 6. Top-Center Soft Horizon Indigo / Purple Nebula (Roaming Cosmic Drift) */}
      <div 
        className="absolute -top-36 left-1/2 -translate-x-1/2 h-[420px] w-[880px] rounded-full bg-gradient-to-r from-indigo-500/28 via-purple-500/24 to-violet-600/20 animate-roam-glow-3"
      />

      {/* 7. Bottom-Left Teal Ambient Nebula (Roaming Accent Aura) */}
      <div 
        className="absolute -bottom-24 -left-24 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-teal-400/28 via-cyan-600/22 to-transparent animate-roam-glow-4"
      />

      {/* 8. Center Play-Area Grounding Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[820px] rounded-full bg-cyan-950/40 blur-[150px]"
      />
    </div>
  );
}
