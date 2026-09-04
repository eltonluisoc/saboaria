import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

interface RevealProps {
  children: ReactNode;
  /** Atraso em ms — usado pra escalonar itens em sequência. */
  delay?: number;
  className?: string;
}

// Fade + leve translate-y ao entrar na viewport. Anima só transform/opacity
// (nunca width/height/margin) pra não causar layout shift.
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
