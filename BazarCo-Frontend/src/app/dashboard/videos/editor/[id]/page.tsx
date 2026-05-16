"use client";

import { use } from "react";
import { SellerVideoEditorView } from "@/components/dashboard/video/SellerVideoEditorView";

export default function VideoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SellerVideoEditorView videoId={id} />;
}
