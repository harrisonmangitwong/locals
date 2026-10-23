import Icon from "@/components/Icon";

// Stands in for a missing or broken photo: the tile's inset gray with a quiet
// utensils mark, never a stock photo of food that isn't theirs. Fills its
// positioned parent, which owns the size and corner radius.
export default function NoPhoto({ size = 22 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-inset)", color: "var(--text-muted)" }}
    >
      <Icon name="utensils" size={size} strokeWidth={1.75} className="opacity-70" />
    </span>
  );
}
