"use client";

import { useParams } from "next/navigation";
import PublicProfile from "@/components/PublicProfile";

export default function PublicListPage() {
  const { userId } = useParams<{ userId: string }>();
  return <PublicProfile userId={userId} />;
}
