"use client";

import {
  Building2,
  Briefcase,
  Calendar,
  Hash,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { CompanyCardExtractedData, NepalIdExtractedData } from "@/lib/api";

export function isNepalId(data: unknown): data is NepalIdExtractedData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Boolean(d["नाम"] ?? d.name ?? d["नागरिकता_नम्बर"] ?? d.citizenshipNumber);
}

export function isCompanyCard(data: unknown): data is CompanyCardExtractedData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Boolean(d.companyName ?? d.registrationNumber ?? d.panNumber ?? d.vatNumber);
}

function clean(v: unknown): string {
  if (v == null) return "";
  return String(v).replace(/^["']|["']$/g, "").trim();
}

export function NepalIdFields({ data }: { data: NepalIdExtractedData }) {
  function displayName(raw: string): string {
    let s = clean(raw).replace(/^धर\s*:\s*/i, "").trim();
    const idx = s.search(/लिङ्ग/i);
    if (idx >= 0) s = s.slice(0, idx).trim();
    return s || clean(raw);
  }

  const rows: { label: string; icon: typeof User; value: string }[] = [];
  const nameRaw = data["नाम"] ?? data.name;
  if (nameRaw) rows.push({ label: "Name", icon: User, value: displayName(String(nameRaw)) });
  const cit = clean(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber ?? "");
  if (cit) rows.push({ label: "Document number", icon: Hash, value: cit });
  const dist = clean(data["जिल्ला"] ?? data.district ?? "");
  if (dist) rows.push({ label: "District", icon: MapPin, value: dist });

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map(({ label, icon: Icon, value }) => (
        <div key={label} className="flex items-start gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 border border-neutral-100">
          <Icon className="w-4 h-4 text-[var(--brand-red)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="text-sm font-medium text-[var(--foreground)]">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompanyCardFields({ data }: { data: CompanyCardExtractedData }) {
  const rows: { label: string; icon: typeof User; value: string }[] = [];
  if (data.companyName) rows.push({ label: "Company", icon: Building2, value: data.companyName });
  if (data.panNumber) rows.push({ label: "PAN", icon: Hash, value: data.panNumber });
  if (data.vatNumber) rows.push({ label: "VAT", icon: Hash, value: data.vatNumber });
  if (data.registrationNumber) rows.push({ label: "Registration", icon: Hash, value: data.registrationNumber });
  if (data.ownerName) rows.push({ label: "Owner", icon: User, value: data.ownerName });
  if (data.contactPhone) rows.push({ label: "Phone", icon: Phone, value: data.contactPhone });
  if (data.contactEmail) rows.push({ label: "Email", icon: Mail, value: data.contactEmail });
  if (data.registeredDate) rows.push({ label: "Registered", icon: Calendar, value: data.registeredDate });
  if (data.companyType) rows.push({ label: "Type", icon: Briefcase, value: data.companyType });

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map(({ label, icon: Icon, value }) => (
        <div key={label} className="flex items-start gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 border border-neutral-100">
          <Icon className="w-4 h-4 text-[var(--brand-red)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="text-sm font-medium text-[var(--foreground)]">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function extractDocNumber(data: unknown): string {
  if (isNepalId(data)) return clean(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber ?? "");
  if (isCompanyCard(data)) return clean(data.panNumber ?? data.registrationNumber ?? data.vatNumber ?? "");
  return "";
}

export function extractFullName(data: unknown): string {
  if (isNepalId(data)) {
    const raw = data["नाम"] ?? data.name;
    if (!raw) return "";
    let s = clean(raw).replace(/^धर\s*:\s*/i, "").trim();
    const idx = s.search(/लिङ्ग/i);
    if (idx >= 0) s = s.slice(0, idx).trim();
    return s;
  }
  if (isCompanyCard(data)) return clean(data.companyName ?? data.ownerName ?? "");
  return "";
}
