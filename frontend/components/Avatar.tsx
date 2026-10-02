const SIZES: Record<"sm" | "md" | "lg", { box: string; text: string }> = {
  sm: { box: "w-9 h-9", text: "text-xs" },
  md: { box: "w-11 h-11", text: "text-sm" },
  lg: { box: "w-16 h-16", text: "text-xl" },
};

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ url, name, size = "md" }: AvatarProps) {
  const { box, text } = SIZES[size];
  const letter = name ? name[0].toUpperCase() : "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className={`${box} rounded-full shrink-0 object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${box} rounded-full flex items-center justify-center font-semibold shrink-0 ${text}`}
      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
    >
      {letter}
    </div>
  );
}
