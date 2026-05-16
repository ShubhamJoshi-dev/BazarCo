"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Crumb = { href?: string; label: string };

export function SellerDashboardBreadcrumb({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const tNav = useTranslations("nav");
  const tBc = useTranslations("breadcrumb");
  const tVid = useTranslations("sellerVideos");

  const crumbs = useMemo((): Crumb[] => {
    const dash = { href: "/dashboard", label: tNav("dashboard") };

    if (pathname === "/dashboard") {
      return [{ label: tNav("dashboard") }];
    }

    const trail: Crumb[] = [dash];

    if (pathname.startsWith("/dashboard/analytics")) {
      trail.push({ label: tNav("analytics") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/report")) {
      trail.push({ label: tNav("reports") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/orders\/[^/]+/)) {
      trail.push({ href: "/dashboard/orders", label: tNav("orders") });
      trail.push({ label: tBc("orderDetail") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/orders")) {
      trail.push({ label: tNav("orders") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/offers")) {
      trail.push({ label: tNav("offers") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/chat\/[^/]+/)) {
      trail.push({ href: "/dashboard/chat", label: tNav("chat") });
      trail.push({ label: tBc("conversation") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/chat")) {
      trail.push({ label: tNav("chat") });
      return trail;
    }
    if (pathname === "/dashboard/products/new") {
      trail.push({ href: "/dashboard/products", label: tNav("products") });
      trail.push({ label: tBc("addProduct") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/products\/[^/]+\/edit/)) {
      trail.push({ href: "/dashboard/products", label: tNav("products") });
      trail.push({ label: tBc("editProduct") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/products")) {
      trail.push({ label: tNav("products") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/product\/[^/]+/)) {
      trail.push({ label: tBc("productDetail") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/kyc")) {
      trail.push({ label: tNav("kyc") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/profile")) {
      trail.push({ label: tNav("profile") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/settings")) {
      trail.push({ label: tNav("settings") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/videos/performance")) {
      trail.push({ href: "/dashboard/videos", label: tVid("navGallery") });
      trail.push({ label: tVid("navPerformance") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/videos\/publish\/[^/]+/)) {
      trail.push({ href: "/dashboard/videos", label: tVid("navGallery") });
      trail.push({ label: tVid("navPublishing") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/videos/publish")) {
      trail.push({ href: "/dashboard/videos", label: tVid("navGallery") });
      trail.push({ label: tVid("navPublishing") });
      return trail;
    }
    if (pathname.match(/^\/dashboard\/videos\/editor\/[^/]+/)) {
      trail.push({ href: "/dashboard/videos", label: tVid("navGallery") });
      trail.push({ label: tVid("navEditor") });
      return trail;
    }
    if (pathname.startsWith("/dashboard/videos")) {
      trail.push({ label: tVid("navGallery") });
      return trail;
    }

    return trail;
  }, [pathname, tNav, tBc, tVid]);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label={tBc("ariaLabel")}
      className={`flex flex-wrap items-center gap-1 text-sm ${className}`}
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[var(--brand-red)]"
      >
        <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-medium">{tBc("home")}</span>
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="truncate rounded-md px-1.5 py-0.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-[var(--brand-red)]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={`truncate px-1.5 py-0.5 font-semibold ${
                  isLast ? "text-[var(--brand-red)]" : "text-neutral-600"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
