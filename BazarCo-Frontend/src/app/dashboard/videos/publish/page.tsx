"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sellerVideosList } from "@/lib/api";

export default function PublishIndexPage() {
  const router = useRouter();
  useEffect(() => {
    sellerVideosList({ status: "draft" }).then((list) => {
      if (list[0]) router.replace(`/dashboard/videos/publish/${list[0].id}`);
      else router.replace("/dashboard/videos");
    });
  }, [router]);
  return null;
}
