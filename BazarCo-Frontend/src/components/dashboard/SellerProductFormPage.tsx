"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  List,
  Package,
  Tag,
  Truck,
  X,
} from "lucide-react";
import {
  categoriesList,
  getKycStatus,
  getProductById,
  productArchive,
  productCreate,
  productPublish,
  productUpdate,
  tagCreate,
  tagsList,
  type KycStatusResponse,
} from "@/lib/api";
import { SellerKycPublishBanner } from "@/components/dashboard/SellerKycPublishBanner";
import {
  formatDisplayAmount,
  storedPriceToDisplay,
  useCurrency,
} from "@/contexts/CurrencyContext";
import { useToast } from "@/contexts/ToastContext";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-neutral-400 focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15 transition-colors";

function FormCard({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: typeof List;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`clay-card p-6 ${className}`}>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[var(--brand-red)]">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
      {children}
      {required && <span className="text-[var(--brand-red)] ml-0.5">*</span>}
    </label>
  );
}

export function SellerProductFormPage({
  mode,
  productId,
}: {
  mode: "create" | "edit";
  productId?: string;
}) {
  const router = useRouter();
  const t = useTranslations("sellerProductForm");
  const toast = useToast();
  const { formatPrice, convertPrice, toUsd, currency } = useCurrency();

  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse["status"] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("50");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [activeListing, setActiveListing] = useState(true);
  const [scheduleLaunch, setScheduleLaunch] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const [loadedUsdPrice, setLoadedUsdPrice] = useState<number | null>(null);

  const listingPrice = useMemo(() => {
    const sale = parseFloat(salePrice);
    const regular = parseFloat(price);
    if (!Number.isNaN(sale) && sale > 0) return sale;
    if (!Number.isNaN(regular) && regular >= 0) return regular;
    return 0;
  }, [price, salePrice]);

  const listingPriceUsd = useMemo(
    () => toUsd(listingPrice),
    [listingPrice, toUsd],
  );

  const loadMeta = useCallback(async () => {
    const [cats, tagList, kyc] = await Promise.all([
      categoriesList(),
      tagsList(),
      getKycStatus(),
    ]);
    setCategories(cats);
    setTags(tagList);
    setKycVerified(kyc?.kycVerified ?? false);
    setKycStatus(kyc?.status ?? "pending");
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    setLoading(true);
    setLoadedUsdPrice(null);
    getProductById(productId)
      .then((data) => {
        if (!data?.product) {
          toast.error(t("loadFailed"));
          router.push("/dashboard/products");
          return;
        }
        const p = data.product;
        setName(p.name);
        setDescription(p.description ?? "");
        setLoadedUsdPrice(Number(p.price));
        setSku(p.sku ?? "");
        setStock(String(p.stock ?? 0));
        setBrand(p.brand ?? "");
        setCategoryId(p.categoryId ?? "");
        setTagIds(p.tagIds ?? []);
        setImagePreview(p.imageUrl ?? null);
        setActiveListing(p.status === "active");
      })
      .finally(() => setLoading(false));
  }, [mode, productId, router, t, toast]);

  /* Stored USD (or legacy NPR in `price`) → display currency in inputs */
  useEffect(() => {
    if (loadedUsdPrice === null || Number.isNaN(loadedUsdPrice)) return;
    const display = storedPriceToDisplay(loadedUsdPrice, currency, convertPrice);
    setPrice(formatDisplayAmount(display, currency));
  }, [loadedUsdPrice, convertPrice, currency]);

  const onMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("imageTypeError"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("imageSizeError"));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTag = async () => {
    const n = newTagName.trim();
    if (!n) return;
    const tag = await tagCreate(n);
    if (tag) {
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setNewTagName("");
    }
  };

  const buildPayload = () => {
    const trimmedName = name.trim();
    const numPrice = listingPriceUsd;
    const numStock = Math.max(0, Math.floor(Number(stock)) || 0);
    return {
      name: trimmedName,
      description: description.trim() || undefined,
      price: numPrice,
      sku: sku.trim() || undefined,
      stock: numStock,
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      tagIds: tagIds.length ? tagIds : undefined,
      image: imageFile ?? undefined,
    };
  };

  const validate = (): string | null => {
    if (!name.trim()) return t("nameRequired");
    if (!description.trim()) return t("descriptionRequired");
    const numPrice = listingPrice;
    if (Number.isNaN(numPrice) || numPrice < 0) return t("priceRequired");
    return null;
  };

  const saveProduct = async (asDraft: boolean) => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const payload = buildPayload();
    const wantsPublish = !asDraft && activeListing;

    if (mode === "create") {
      const { product: created, message, published } = await productCreate(payload, {
        publish: wantsPublish,
      });
      setSubmitting(false);
      if (!created) {
        setError(message ?? t("saveFailed"));
        toast.error(message ?? t("saveFailed"));
        return;
      }
      if (wantsPublish && !published && !kycVerified) {
        toast.success(message ?? t("savedDraft"));
      } else {
        toast.success(message ?? (published ? t("published") : t("savedDraft")));
      }
      router.push("/dashboard/products");
      return;
    }

    if (productId) {
      const updated = await productUpdate(productId, { ...payload, tagIds });
      if (!updated) {
        setSubmitting(false);
        setError(t("saveFailed"));
        toast.error(t("saveFailed"));
        return;
      }
      if (wantsPublish && updated.status === "draft") {
        if (!kycVerified) {
          setSubmitting(false);
          toast.success(t("savedDraft"));
          router.push("/dashboard/products");
          return;
        }
        const pub = await productPublish(productId);
        setSubmitting(false);
        if (!pub.product) {
          toast.error(pub.message ?? t("saveFailed"));
          router.push("/dashboard/products");
          return;
        }
        toast.success(t("published"));
        router.push("/dashboard/products");
        return;
      }
      if (asDraft && updated.status === "active") {
        await productArchive(productId);
      }
      setSubmitting(false);
      toast.success(asDraft ? t("savedDraft") : t("updated"));
      router.push("/dashboard/products");
    }
  };

  const selectedTagNames = tags.filter((tg) => tagIds.includes(tg.id)).map((tg) => tg.name);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-8 w-48 rounded-lg bg-neutral-100 animate-pulse" />
        <div className="h-12 w-96 rounded-lg bg-neutral-100 animate-pulse" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-64 clay-card animate-pulse bg-neutral-50" />
            <div className="h-48 clay-card animate-pulse bg-neutral-50" />
          </div>
          <div className="space-y-5">
            <div className="h-72 clay-card animate-pulse bg-neutral-50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
            {mode === "create" ? t("titleCreate") : t("titleEdit")}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={() => saveProduct(true)}
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            {t("saveDraft")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => saveProduct(false)}
            className="rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b71c1c] disabled:opacity-50 transition-colors"
          >
            {submitting
              ? t("saving")
              : mode === "create"
                ? t("publishProduct")
                : t("saveChanges")}
          </button>
        </div>
      </div>

      <SellerKycPublishBanner
        kycVerified={kycVerified}
        kycStatus={kycStatus}
        className="mb-5"
      />

      {error && (
        <p className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <FormCard icon={List} title={t("basicInfo")}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-title" required>
                  {t("productTitle")}
                </Label>
                <input
                  id="product-title"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("productTitlePlaceholder")}
                  className={inputClass}
                  maxLength={200}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">{t("category")}</Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("categoryNone")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="brand">{t("brandName")}</Label>
                  <input
                    id="brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder={t("brandPlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" required>
                  {t("description")}
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={t("descriptionPlaceholder")}
                  className={`${inputClass} resize-y min-h-[120px]`}
                />
              </div>
            </div>
          </FormCard>

          <FormCard icon={Tag} title={t("inventoryPricing")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="price" required>
                  {t("priceLabel", { currency })}
                </Label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="sale-price">{t("salePriceLabel", { currency })}</Label>
                <input
                  id="sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={t("optional")}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="sku">{t("skuCode")}</Label>
                <input
                  id="sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder={t("skuAuto")}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="stock">{t("stockQuantity")}</Label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`${inputClass} max-w-xs`}
              />
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
              <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
              <p>{t("pricingTip")}</p>
            </div>
          </FormCard>

          <FormCard icon={Truck} title={t("shippingLogistics")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="weight">{t("weightKg")}</Label>
                <input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="0.5"
                  className={inputClass}
                />
              </div>
              <div>
                <Label>{t("packageDimensions")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={dimL}
                    onChange={(e) => setDimL(e.target.value)}
                    placeholder="L"
                    className={inputClass}
                    aria-label={t("dimLength")}
                  />
                  <input
                    type="number"
                    min="0"
                    value={dimW}
                    onChange={(e) => setDimW(e.target.value)}
                    placeholder="W"
                    className={inputClass}
                    aria-label={t("dimWidth")}
                  />
                  <input
                    type="number"
                    min="0"
                    value={dimH}
                    onChange={(e) => setDimH(e.target.value)}
                    placeholder="H"
                    className={inputClass}
                    aria-label={t("dimHeight")}
                  />
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">{t("shippingNote")}</p>
              </div>
            </div>
          </FormCard>
        </div>

        <div className="min-w-0 space-y-5">
          <FormCard icon={ImagePlus} title={t("mediaGallery")}>
            <input
              ref={mainImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onMainImage}
            />
            <button
              type="button"
              onClick={() => mainImageRef.current?.click()}
              className="w-full min-h-[180px] rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/80 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-[var(--brand-red)]/40 hover:bg-red-50/30 transition-colors overflow-hidden relative"
            >
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="" fill className="object-cover" sizes="400px" unoptimized />
                  <span className="relative z-10 rounded-lg bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    {t("changeImage")}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-600">{t("uploadMainImage")}</span>
                </>
              )}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[0, 1].map((slot) => (
                <div
                  key={slot}
                  className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center"
                >
                  <span className="text-[10px] text-neutral-400 text-center px-2">{t("extraImageSoon")}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">{t("mediaHint")}</p>
          </FormCard>

          <FormCard icon={Eye} title={t("publishingStatus")}>
            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{t("activeListing")}</p>
                    <p className="text-xs text-neutral-500">{t("activeListingDesc")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeListing}
                  onClick={() => setActiveListing((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    activeListing ? "bg-[var(--brand-red)]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      activeListing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 opacity-75">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    ⏱
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{t("scheduleLaunch")}</p>
                    <p className="text-xs text-neutral-500">{t("scheduleSoon")}</p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={scheduleLaunch}
                  onChange={() => setScheduleLaunch(true)}
                  disabled
                  className="h-4 w-4 accent-[var(--brand-red)]"
                />
              </li>
            </ul>

            <div className="mt-5 pt-5 border-t border-neutral-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                {t("productTags")}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTagNames.map((label) => {
                  const tag = tags.find((tg) => tg.name === label);
                  return (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-medium"
                    >
                      {label}
                      {tag && (
                        <button
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="hover:text-blue-950"
                          aria-label={t("removeTag")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags
                  .filter((tg) => !tagIds.includes(tg.id))
                  .slice(0, 8)
                  .map((tg) => (
                    <button
                      key={tg.id}
                      type="button"
                      onClick={() => toggleTag(tg.id)}
                      className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                    >
                      + {tg.name}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t("addTagPlaceholder")}
                  className={`${inputClass} flex-1`}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  {t("addTag")}
                </button>
              </div>
            </div>
          </FormCard>

          <div className="rounded-xl bg-neutral-900 text-white p-4 shadow-lg">
            <span className="inline-block rounded bg-[var(--brand-red)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3">
              {t("storefrontPreview")}
            </span>
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                {imagePreview ? (
                  <Image src={imagePreview} alt="" fill className="object-cover" sizes="64px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="w-6 h-6 text-neutral-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {name.trim() || t("previewTitleFallback")}
                </p>
                <p className="text-lg font-bold text-white mt-1 tabular-nums">
                  {formatPrice(listingPriceUsd)}
                </p>
                {salePrice && parseFloat(salePrice) > 0 && parseFloat(price) > parseFloat(salePrice) && (
                  <p className="text-xs text-neutral-400 line-through">
                    {formatPrice(toUsd(parseFloat(price)))}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
