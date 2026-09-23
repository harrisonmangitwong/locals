import type { ReactNode } from "react";

interface LockedStateProps {
  heading: string;
  body: string;
  cta: ReactNode;
}

export default function LockedState({ heading, body, cta }: LockedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
        {heading}
      </p>
      <p className="text-sm mb-6 max-w-md" style={{ color: "var(--text-muted)" }}>
        {body}
      </p>
      {cta}
    </div>
  );
}
