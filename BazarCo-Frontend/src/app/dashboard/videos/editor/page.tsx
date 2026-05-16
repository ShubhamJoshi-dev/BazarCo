"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { sellerVideosList } from "@/lib/api";

export default function VideoEditorIndexPage() {
  const t = useTranslations("sellerVideos");
  const [ids, setIds] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    sellerVideosList().then((list) => setIds(list.map((v) => ({ id: v.id, title: v.title }))));
  }, []);

  return (
    <div className="w-full max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{t("navEditor")}</h1>
      <p className="text-sm text-neutral-500">{t("editorPick")}</p>
      <ul className="clay-card divide-y divide-neutral-100">
        {ids.length === 0 ? (
          <li className="p-6 text-sm text-neutral-500">{t("emptyTitle")}</li>
        ) : (
          ids.map((v) => (
            <li key={v.id}>
              <Link
                href={`/dashboard/videos/editor/${v.id}`}
                className="block px-5 py-3 text-sm font-medium hover:bg-neutral-50 hover:text-[var(--brand-red)]"
              >
                {v.title}
              </Link>
            </li>
          ))
        )}
      </ul>
      <Link href="/dashboard/videos" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
        {t("backGallery")}
      </Link>
    </div>
  );
}
