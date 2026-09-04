import { useEffect, useRef, useState } from "react";

function prefersReducedMotionOrNoObserver() {
  if (typeof IntersectionObserver === "undefined") return true;
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Revela um elemento (visible=true) uma única vez, quando ele entra na
 * viewport. Motion é só reforço visual: se o ambiente não suportar
 * IntersectionObserver, ou o usuário preferir menos movimento, o elemento
 * já nasce visible=true — nunca esconde conteúdo por acidente.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(() => prefersReducedMotionOrNoObserver());

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, visible };
}
