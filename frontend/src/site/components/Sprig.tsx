interface SprigProps {
  className?: string;
}

const LEAVES = [
  { x: 59, y: 190, rotate: -60, scale: 1 },
  { x: 64, y: 165, rotate: 55, scale: 0.95 },
  { x: 56, y: 135, rotate: -50, scale: 0.9 },
  { x: 62, y: 105, rotate: 50, scale: 0.85 },
  { x: 55, y: 75, rotate: -45, scale: 0.75 },
  { x: 60, y: 45, rotate: 40, scale: 0.65 },
];

export function Sprig({ className = "" }: SprigProps) {
  return (
    <svg
      viewBox="0 0 120 220"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M62 210 C56 170 68 140 58 100 C50 70 64 45 60 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {LEAVES.map((leaf, i) => (
        <path
          key={i}
          d="M0 0 C5 -5 5 -15 0 -22 C-5 -15 -5 -5 0 0 Z"
          fill="currentColor"
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
        />
      ))}
    </svg>
  );
}
