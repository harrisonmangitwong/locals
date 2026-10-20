interface FollowCountsProps {
  followers: number;
  following: number;
  onSelect: (type: "followers" | "following") => void;
}

// Counts read as text ("12 followers  3 following"), each one a quiet
// button that opens the list.
export default function FollowCounts({ followers, following, onSelect }: FollowCountsProps) {
  return (
    <div className="flex items-center gap-1 text-[15px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
      <button onClick={() => onSelect("followers")} className="min-h-[44px] px-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]">
        <strong className="font-semibold" style={{ color: "var(--text)" }}>{followers}</strong> {followers === 1 ? "follower" : "followers"}
      </button>
      <button onClick={() => onSelect("following")} className="min-h-[44px] px-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]">
        <strong className="font-semibold" style={{ color: "var(--text)" }}>{following}</strong> following
      </button>
    </div>
  );
}
