"use client";

import { useRouter } from "next/navigation";
import { SellerVideoWorkspaceLayout } from "@/components/dashboard/video/SellerVideoWorkspaceLayout";

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <SellerVideoWorkspaceLayout
      onUploadClick={() => router.push("/dashboard/videos?upload=1")}
    >
      {children}
    </SellerVideoWorkspaceLayout>
  );
}
