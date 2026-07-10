"use client";

export default function BackgroundGrid() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 opacity-[0.15]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        animation: "grid-pan 30s linear infinite",
      }}
    />
  );
}
