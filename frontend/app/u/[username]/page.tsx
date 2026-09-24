"use client";

import { useParams } from "next/navigation";
import PublicProfile from "@/components/PublicProfile";

export default function PublicUsernamePage() {
  const { username } = useParams<{ username: string }>();
  return <PublicProfile username={username} />;
}
