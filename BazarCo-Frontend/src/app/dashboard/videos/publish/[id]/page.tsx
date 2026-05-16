"use client";

import { use } from "react";
import { SellerVideoPublishView } from "@/components/dashboard/video/SellerVideoPublishView";

export default function VideoPublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SellerVideoPublishView videoId={id} />;
}
