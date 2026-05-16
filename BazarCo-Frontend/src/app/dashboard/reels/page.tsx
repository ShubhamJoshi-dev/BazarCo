"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductReelsView } from "@/components/marketplace/ProductReelsView";

function ReelsPageInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const startVideoId = searchParams.get("v");
  return <ProductReelsView productId={productId} startVideoId={startVideoId} />;
}

export default function ReelsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center bg-black text-white text-sm">
          Loading…
        </div>
      }
    >
      <ReelsPageInner />
    </Suspense>
  );
}
