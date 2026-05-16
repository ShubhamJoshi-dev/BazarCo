"use client";

import { Suspense } from "react";
import { SellerVideoGalleryView } from "@/components/dashboard/video/SellerVideoGalleryView";

export default function VideosGalleryPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}>
      <SellerVideoGalleryView />
    </Suspense>
  );
}
