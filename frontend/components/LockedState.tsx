import type { ReactNode } from "react";

interface LockedStateProps {
  heading: string;
  body: string;
  cta: ReactNode;
}

// Signed-out and empty states: a short heading, one line of why, one action.
export default function LockedState({ heading, body, cta }: LockedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[19px] font-semibold" style={{ color: "var(--text)" }}>
        {heading}
      </p>
      <p className="text-[15px] leading-relaxed mt-1.5 mb-6 max-w-[34ch] text-pretty" style={{ color: "var(--text-secondary)" }}>
        {body}
      </p>
      {cta}
    </div>
  );
}
