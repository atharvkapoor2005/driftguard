"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const springX = useSpring(x, { damping: 30, stiffness: 200, mass: 0.5 });
  const springY = useSpring(y, { damping: 30, stiffness: 200, mass: 0.5 });
  const enabled = useRef(true);

  useEffect(() => {
    enabled.current = window.matchMedia("(pointer: fine)").matches;
    if (!enabled.current) return;

    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed -z-10 w-[500px] h-[500px] rounded-full hidden md:block"
      style={{
        left: springX,
        top: springY,
        x: "-50%",
        y: "-50%",
        background:
          "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 40%, transparent 70%)",
      }}
    />
  );
}
