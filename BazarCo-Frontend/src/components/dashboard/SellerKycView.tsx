"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  IdCard,
  ImagePlus,
  Loader2,
  Shield,
  Store,
  X,
} from "lucide-react";
import {
  deleteKycDocument,
  getKycStatus,
  uploadKycDocument,
  type KycDocument,
  type KycDocumentType,
  type KycStatusResponse,
} from "@/lib/api";
import {
  CompanyCardFields,
  extractDocNumber,
  extractFullName,
  isCompanyCard,
  isNepalId,
  NepalIdFields,
} from "@/components/dashboard/kyc/KycExtractedFields";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-neutral-400 focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15";

type StepId = "profile" | "identity" | "business" | "bank";

function docFileName(doc: KycDocument): string {
  try {
    const u = new URL(doc.fileUrl);
    const part = u.pathname.split("/").pop() ?? "";
    return part.length > 24 ? `${part.slice(0, 20)}…` : part || "document.jpg";
  } catch {
    return "document.jpg";
  }
}

function docRowStatus(
  doc: KycDocument | undefined,
  kycVerified: boolean,
  kycStatus: string,
): { label: string; className: string } {
  if (!doc) return { label: "Pending upload", className: "text-blue-700 bg-blue-50 border-blue-200" };
  if (kycVerified) return { label: "Verified", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (kycStatus === "rejected" || doc.extractionStatus === "invalid")
    return { label: "Action required", className: "text-red-700 bg-red-50 border-red-200" };
  if (doc.extractionStatus === "pending")
    return { label: "Under review", className: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "Under review", className: "text-amber-700 bg-amber-50 border-amber-200" };
}

function UploadDropzone({
  label,
  hint,
  preview,
  onPick,
  disabled,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onPick: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-600 mb-2">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="relative w-full min-h-[140px] rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/80 flex flex-col items-center justify-center gap-2 p-4 text-center hover:border-[var(--brand-red)]/40 hover:bg-red-50/20 transition-colors disabled:opacity-50 overflow-hidden"
      >
        {preview ? (
          <>
            <Image src={preview} alt="" fill className="object-cover" sizes="200px" unoptimized />
            <span className="relative z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">{hint}</span>
          </>
        ) : (
          <>
            <ImagePlus className="w-8 h-8 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-600">{hint}</span>
            <span className="text-xs text-neutral-400">PNG, JPG up to 5MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function SellerKycView() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations("sellerKyc");
  const toast = useToast();

  const [kyc, setKyc] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<StepId>("identity");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [docType, setDocType] = useState<KycDocumentType>("national_card");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    const data = await getKycStatus();
    setKyc(data ?? null);
    const national = data?.documents?.find((d) => d.documentType === "national_card");
    const company = data?.documents?.find((d) => d.documentType === "company_card");
    const primary = national ?? company;
    if (primary?.extractedData) {
      setDocumentNumber((prev) => prev || extractDocNumber(primary.extractedData));
      setFullName((prev) => prev || extractFullName(primary.extractedData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const hasShownVerifiedToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("verified") !== "1" || hasShownVerifiedToast.current) return;
    hasShownVerifiedToast.current = true;
    toast.success(t("verifiedToast"));
    window.history.replaceState({}, "", "/dashboard/kyc");
  }, [searchParams, toast, t]);

  const nationalDocs = useMemo(
    () => kyc?.documents?.filter((d) => d.documentType === "national_card") ?? [],
    [kyc?.documents],
  );
  const companyDoc = useMemo(
    () => kyc?.documents?.find((d) => d.documentType === "company_card"),
    [kyc?.documents],
  );

  const steps = useMemo(() => {
    const profileDone = Boolean(user?.name && user?.email);
    const identityDone =
      (kyc?.kycVerified ?? false) ||
      nationalDocs.some((d) => d.extractionStatus === "success" && d.isValidNationalId);
    const businessDone =
      Boolean(companyDoc?.extractionStatus === "success" && companyDoc.isValidNationalId) ||
      (kyc?.kycVerified ?? false);
    return [
      { id: "profile" as const, label: t("stepStoreProfile"), done: profileDone },
      { id: "identity" as const, label: t("stepIdentity"), done: identityDone },
      { id: "business" as const, label: t("stepBusiness"), done: businessDone },
      { id: "bank" as const, label: t("stepBank"), done: false, upcoming: true },
    ];
  }, [user, kyc, nationalDocs, companyDoc, t]);

  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  const statusPill = useMemo(() => {
    if (kyc?.kycVerified) return { text: t("statusVerified"), className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (kyc?.status === "rejected") return { text: t("statusActionRequired"), className: "text-red-700 bg-red-50 border-red-200" };
    return { text: t("statusActionRequired"), className: "text-blue-700 bg-blue-50 border-blue-200" };
  }, [kyc, t]);

  const pickFront = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("imageTypeError"));
      return;
    }
    setError(null);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
    setDocType("national_card");
  };

  const pickBack = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("imageTypeError"));
      return;
    }
    setError(null);
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (type: KycDocumentType, file: File) => {
    const result = await uploadKycDocument(type, file);
    if (!result.success) throw new Error(result.message ?? t("uploadFailed"));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!frontFile && nationalDocs.length === 0) {
      setError(t("frontRequired"));
      return;
    }
    setUploading(true);
    try {
      if (frontFile) await uploadFile(docType, frontFile);
      if (backFile && docType === "national_card") await uploadFile("national_card", backFile);
      toast.success(t("submitted"));
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(null);
      setBackPreview(null);
      await fetchKyc();
      setActiveStep("business");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("uploadFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleBusinessUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await uploadFile("company_card", file);
      toast.success(t("businessUploaded"));
      await fetchKyc();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("uploadFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const overviewRows = useMemo(
    () => [
      {
        key: "pan",
        category: t("catPanVat"),
        doc: companyDoc,
        fileName: companyDoc ? docFileName(companyDoc) : "—",
      },
      {
        key: "license",
        category: t("catBusinessLicense"),
        doc: companyDoc,
        fileName: companyDoc ? docFileName(companyDoc) : "",
        pending: !companyDoc,
      },
      {
        key: "id",
        category: t("catNationalId"),
        doc: nationalDocs[0],
        fileName: nationalDocs[0] ? docFileName(nationalDocs[0]) : "—",
      },
      {
        key: "bank",
        category: t("catBankCheque"),
        doc: undefined as KycDocument | undefined,
        fileName: "",
        pending: true,
      },
    ],
    [companyDoc, nationalDocs, t],
  );

  const rejectionMessage =
    kyc?.rejectionReason ??
    nationalDocs.find((d) => d.extractionStatus === "invalid")?.extractionError ??
    companyDoc?.extractionError;

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] gap-3 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-red)]" />
        <p className="text-sm">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl">{t("subtitle")}</p>
        </div>
        <div className="shrink-0 text-sm">
          <span className="text-neutral-500">{t("currentStatus")}: </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold ${statusPill.className}`}>
            {statusPill.text}
          </span>
        </div>
      </div>

      {kyc?.kycVerified && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3 text-emerald-900 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {t("verifiedBanner")}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <div className="clay-card p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">{t("verificationSteps")}</h2>
            <ol className="space-y-0">
              {steps.map((step, index) => {
                const isCurrent = step.id === activeStep;
                const isLast = index === steps.length - 1;
                return (
                  <li key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                          step.done
                            ? "bg-emerald-100 text-emerald-700"
                            : isCurrent
                              ? "bg-[var(--brand-red)] text-white"
                              : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        {step.done ? <Check className="w-4 h-4" /> : index + 1}
                      </span>
                      {!isLast && <span className="w-px flex-1 min-h-[28px] bg-neutral-200 my-1" />}
                    </div>
                    <button
                      type="button"
                      disabled={step.upcoming}
                      onClick={() => !step.upcoming && setActiveStep(step.id)}
                      className={`pb-5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                        isCurrent ? "text-[var(--brand-red)]" : step.done ? "text-[var(--foreground)]" : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                      {step.upcoming && (
                        <span className="block text-xs font-normal text-neutral-400 mt-0.5">{t("comingSoon")}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-[#1565c0] to-[#0d47a1] p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">{t("securityTitle")}</h3>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">{t("securityDesc")}</p>
          </div>
        </aside>

        <div className="space-y-5 min-w-0">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
          )}

          {activeStep === "profile" && (
            <div className="clay-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepStoreProfile")}</h2>
              <p className="text-sm text-neutral-500">{t("profileDesc")}</p>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">{t("accountName")}</dt>
                  <dd className="font-medium mt-1">{user?.name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">{t("accountEmail")}</dt>
                  <dd className="font-medium mt-1">{user?.email}</dd>
                </div>
              </dl>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-red)] hover:underline"
              >
                {t("editShopProfile")} <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setActiveStep("identity")}
                className="rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t("continueToIdentity")}
              </button>
            </div>
          )}

          {activeStep === "identity" && (
            <div className="clay-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <IdCard className="w-5 h-5 text-[var(--brand-red)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("identityTitle")}</h2>
              </div>
              <p className="text-sm text-neutral-500 mb-6">{t("identityDesc")}</p>

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <UploadDropzone
                  label={t("docFront")}
                  hint={t("uploadOrDrop")}
                  preview={frontPreview ?? nationalDocs[0]?.fileUrl ?? null}
                  onPick={pickFront}
                  disabled={uploading}
                />
                <UploadDropzone
                  label={t("docBack")}
                  hint={t("uploadOrDrop")}
                  preview={backPreview ?? nationalDocs[1]?.fileUrl ?? null}
                  onPick={pickBack}
                  disabled={uploading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                    {t("documentNumber")}
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className={inputClass}
                    placeholder={t("documentNumberPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                  {t("guidelinesTitle")}
                </p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {[t("guide1"), t("guide2"), t("guide3")].map((text, i) => (
                    <li key={text} className="flex items-start gap-2">
                      {i < 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {nationalDocs[0]?.extractedData && isNepalId(nationalDocs[0].extractedData) && (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase text-neutral-500 mb-2">{t("extractedInfo")}</p>
                  <NepalIdFields data={nationalDocs[0].extractedData} />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  onClick={() => toast.success(t("savedLocally"))}
                >
                  {t("saveForLater")}
                </button>
                <button
                  type="button"
                  disabled={currentStepIndex <= 0}
                  onClick={() => setActiveStep("profile")}
                  className="rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-40"
                >
                  {t("previousStep")}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleSubmit}
                  className="ml-auto rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("submitContinue")
                  )}
                </button>
              </div>
            </div>
          )}

          {activeStep === "business" && (
            <div className="clay-card p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--brand-red)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("stepBusiness")}</h2>
              </div>
              <p className="text-sm text-neutral-500">{t("businessDesc")}</p>
              <label className="block">
                <span className="sr-only">{t("uploadBusiness")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="business-doc"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBusinessUpload(f);
                  }}
                />
                <span
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && document.getElementById("business-doc")?.click()}
                  onClick={() => document.getElementById("business-doc")?.click()}
                  className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 hover:border-[var(--brand-red)]/40"
                >
                  {companyDoc?.fileUrl ? (
                    <div className="relative h-24 w-full max-w-xs rounded-lg overflow-hidden">
                      <Image src={companyDoc.fileUrl} alt="" fill className="object-contain" unoptimized />
                    </div>
                  ) : (
                    <>
                      <Store className="w-10 h-10 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-600">{t("uploadBusiness")}</span>
                    </>
                  )}
                </span>
              </label>
              {companyDoc?.extractedData && isCompanyCard(companyDoc.extractedData) && (
                <CompanyCardFields data={companyDoc.extractedData} />
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveStep("identity")} className="rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium">
                  {t("previousStep")}
                </button>
                <button type="button" onClick={() => setActiveStep("bank")} className="ml-auto rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white">
                  {t("submitContinue")}
                </button>
              </div>
            </div>
          )}

          {activeStep === "bank" && (
            <div className="clay-card p-6 text-center space-y-4">
              <CreditCard className="w-12 h-12 mx-auto text-neutral-300" />
              <h2 className="text-lg font-semibold">{t("stepBank")}</h2>
              <p className="text-sm text-neutral-500">{t("bankSoon")}</p>
              <button type="button" onClick={() => setActiveStep("business")} className="rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium">
                {t("previousStep")}
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="clay-card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("applicationOverview")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left">
                <th className="px-6 py-3 font-semibold text-neutral-600">{t("colCategory")}</th>
                <th className="px-6 py-3 font-semibold text-neutral-600">{t("colFile")}</th>
                <th className="px-6 py-3 font-semibold text-neutral-600">{t("colStatus")}</th>
                <th className="px-6 py-3 font-semibold text-neutral-600 text-right">{t("colAction")}</th>
              </tr>
            </thead>
            <tbody>
              {overviewRows.map((row) => {
                const status = docRowStatus(row.doc, kyc?.kycVerified ?? false, kyc?.status ?? "pending");
                const showPending = row.pending && !row.doc;
                return (
                  <tr key={row.key} className="border-b border-neutral-50 last:border-0">
                    <td className="px-6 py-4 font-medium text-[var(--foreground)]">{row.category}</td>
                    <td className="px-6 py-4 text-neutral-500">{showPending ? "—" : row.fileName || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.doc ? (
                        <a
                          href={row.doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[var(--brand-blue)] hover:underline inline-flex items-center gap-1"
                        >
                          {kyc?.status === "rejected" ? t("reupload") : t("viewFile")}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveStep(row.key === "bank" ? "bank" : row.key === "id" ? "identity" : "business")}
                          className="font-semibold text-[var(--brand-blue)] hover:underline"
                        >
                          {t("uploadNow")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rejectionMessage && (
          <div className="mx-6 mb-6 mt-2 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">{t("rejectionTitle")}</p>
              <p className="mt-1 text-red-800/90">{rejectionMessage}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
