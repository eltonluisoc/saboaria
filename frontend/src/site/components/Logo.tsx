import { Sprig } from "./Sprig";

interface LogoProps {
  size?: "lg" | "sm";
  className?: string;
}

export function Logo({ size = "sm", className = "" }: LogoProps) {
  if (size === "lg") {
    return (
      <div className={`flex flex-col items-center text-brand-cream ${className}`}>
        <Sprig className="h-14 w-auto text-brand-gold" />
        <span className="mt-2 font-serif-brand text-7xl tracking-tight sm:text-8xl">Lud&apos;E</span>
        <span className="mt-3 text-xs font-medium uppercase tracking-[0.35em] text-brand-gold">
          Rituais de Banho &amp; Ancestralidade
        </span>
      </div>
    );
  }

  return (
    <span className={`font-serif-brand text-2xl text-brand-cream ${className}`}>Lud&apos;E</span>
  );
}
