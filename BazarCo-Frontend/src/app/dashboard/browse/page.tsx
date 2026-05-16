"use client";

import { Suspense } from "react";
import { BrowseProductsView } from "@/components/marketplace/BrowseProductsView";

function BrowseFallback() {
  return (
    <div className="w-full max-w-[1400px] mx-auto animate-pulse space-y-4">
      <div className="h-4 w-48 bg-neutral-200 rounded" />
      <div className="h-8 w-64 bg-neutral-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-neutral-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseProductsView />
    </Suspense>
  );
}
