interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

// A toggle chip: soft gray at rest, the action ink when on (.filter-pill).
export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`filter-pill h-11 px-4 text-[15px] font-medium inline-flex items-center${active ? " is-active" : ""}`}
    >
      {label}
    </button>
  );
}
