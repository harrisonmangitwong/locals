interface FollowCountsProps {
  followers: number;
  following: number;
  onSelect: (type: "followers" | "following") => void;
}

export default function FollowCounts({ followers, following, onSelect }: FollowCountsProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onSelect("followers")}
        className="flex items-center gap-1 px-3 min-h-[44px] rounded-full transition-colors hover:opacity-75"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
      >
        <strong style={{ color: "var(--text)" }}>{followers}</strong> followers
      </button>
      <button
        onClick={() => onSelect("following")}
        className="flex items-center gap-1 px-3 min-h-[44px] rounded-full transition-colors hover:opacity-75"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
      >
        <strong style={{ color: "var(--text)" }}>{following}</strong> following
      </button>
    </div>
  );
}
