import Link from "next/link";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";

export interface Person {
  userId: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  isActiveLocal?: boolean;
  isPrivate?: boolean;
}

// One person in a list (followers, following, Find people): avatar, name,
// a quiet second line, and a lock when their list is private.
export default function PersonRow({ p, meta, onSelect }: { p: Person; meta?: string | null; onSelect?: () => void }) {
  return (
    <Link
      href={p.username ? `/u/${p.username}` : `/list/${p.userId}`}
      onClick={onSelect}
      className="flex items-center gap-3 min-h-[52px] -mx-2 px-2 rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
    >
      <Avatar url={p.avatarUrl} name={p.name} size="sm" />
      <span className="flex flex-col min-w-0">
        <span className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>{p.name}</span>
        {meta && <span className="text-[13px] truncate" style={{ color: "var(--text-secondary)" }}>{meta}</span>}
      </span>
      {p.isPrivate && (
        <span className="ml-auto shrink-0" style={{ color: "var(--text-muted)" }} aria-label="Private list">
          <Icon name="lock" size={14} />
        </span>
      )}
    </Link>
  );
}
