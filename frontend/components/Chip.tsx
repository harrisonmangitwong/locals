interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="text-sm font-medium px-3 py-2 rounded-full transition-all duration-150 min-h-[44px] flex items-center hover:opacity-85"
      style={{
        backgroundColor: active ? "var(--accent)" : "var(--bg-subtle)",
        color: active ? "#ffffff" : "var(--text-secondary)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );
}
