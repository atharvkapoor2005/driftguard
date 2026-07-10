"use client";

export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 300 300"
      className="w-64 h-64 md:w-80 md:h-80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="150" cy="150" r="140" fill="url(#radarGlow)" />
      {[140, 105, 70, 35].map((r) => (
        <circle
          key={r}
          cx="150"
          cy="150"
          r={r}
          fill="none"
          stroke="#233047"
          strokeWidth="1"
        />
      ))}
      <line x1="10" y1="150" x2="290" y2="150" stroke="#233047" strokeWidth="1" />
      <line x1="150" y1="10" x2="150" y2="290" stroke="#233047" strokeWidth="1" />

      <g style={{ transformOrigin: "150px 150px" }}>
        <path d="M150,150 L150,10 A140,140 0 0,1 262,80 Z" fill="url(#sweepGrad)" opacity="0.6">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 150 150"
            to="360 150 150"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {[
        { x: 150, y: 60, c: "#f43f5e", delay: "0s" },
        { x: 220, y: 150, c: "#f59e0b", delay: "0.6s" },
        { x: 110, y: 210, c: "#22c55e", delay: "1.2s" },
        { x: 90, y: 100, c: "#38bdf8", delay: "1.8s" },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={p.c} />
          <circle cx={p.x} cy={p.y} r="5" fill={p.c} opacity="0.5">
            <animate
              attributeName="r"
              values="5;16;5"
              dur="2.4s"
              begin={p.delay}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;0;0.5"
              dur="2.4s"
              begin={p.delay}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      <circle cx="150" cy="150" r="4" fill="#e5e7eb" />
    </svg>
  );
}
