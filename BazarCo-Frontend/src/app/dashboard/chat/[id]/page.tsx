"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ChatIdRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) router.replace("/dashboard/chat?with=" + encodeURIComponent(id));
    else router.replace("/dashboard/chat");
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
    </div>
  );
}
