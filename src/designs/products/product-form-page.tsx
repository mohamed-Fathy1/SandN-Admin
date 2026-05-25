import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  GripVertical,
  ImageIcon,
  Layers,
  Plus,
  Ruler,
  Tag,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdminFormField,
  AdminImageUploader,
  AdminImageUploaderMulti,
  BilingualInput,
  Button,
  Card,
  DateInput,
  FadeUp,
  GenericBadge,
  Input,
  Kbd,
  NumberInput,
  NotFoundState,
  PageSkeleton,
  QueryErrorState,
  SearchableSelect,
  StickyActionBar,
  type StickyActionStatus,
  usePrefersReducedMotion,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import { useCategories } from '@/features/catalog/categories/hooks/use-categories';
import { useSubCategories } from '@/features/catalog/sub-categories/hooks/use-sub-categories';
import { useColors } from '@/features/catalog/colors/hooks/use-colors';
import { useSizes } from '@/features/catalog/sizes/hooks/use-sizes';
import {
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/features/products/hooks/use-products';
import { productFormSchema } from '@/features/products/schemas/product-form';
import type {
  ApiCategory,
  ApiColor,
  ApiProduct,
  ApiSize,
  ApiSubCategory,
} from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { idOf } from '@/shared/utils/relations';
import { isNotFoundError } from '@/shared/lib/api-error';
import { formatEGP } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface VariantRow {
  size: string;
  color: string;
  quantity: number;
}

interface FormState {
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number | '';
  wholesalePrice: number | '';
  salePrice: number | '';
  saleStartDate: number;
  saleEndDate: number;
  category: string;
  subCategory: string;
  defaultImage: string;
  albumImages: string[];
  sizeChartImage: string;
  variants: VariantRow[];
}

interface ProductFormErrors {
  name?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  price?: string;
  wholesalePrice?: string;
  salePrice?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  category?: string;
  subCategory?: string;
  defaultImage?: string;
  albumImages?: string;
  variants?: string;
  variantRows?: Record<number, { size?: string; color?: string; quantity?: string }>;
}

interface ProductFormPageProps {
  productId?: string;
}

export function ProductFormPage({ productId }: ProductFormPageProps) {
  const navigate = useNavigate();
  const isEdit = Boolean(productId);
  const productQuery = useProduct(productId);

  if (isEdit && productQuery.isPending) return <PageSkeleton />;
  if (isEdit && productQuery.isError) {
    if (isNotFoundError(productQuery.error)) {
      return (
        <NotFoundState
          error={productQuery.error}
          onBack={() => navigate({ to: ROUTES.products, search: { page: 1, search: '' } })}
          backLabel="Back to products"
        />
      );
    }
    return (
      <QueryErrorState error={productQuery.error} onRetry={() => productQuery.refetch()} />
    );
  }

  return (
    <ProductFormInner
      key={productQuery.data?._id ?? 'new'}
      existing={productQuery.data ?? null}
    />
  );
}

type SectionId = 'basics' | 'pricing' | 'classification' | 'variants' | 'media';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'classification', label: 'Classification' },
  { id: 'variants', label: 'Variants' },
  { id: 'media', label: 'Media' },
];

function ProductFormInner({ existing }: { existing: ApiProduct | null }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);

  const categoriesQuery = useCategories();
  const subCategoriesQuery = useSubCategories();
  const colorsQuery = useColors();
  const sizesQuery = useSizes();

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isPending = create.isPending || update.isPending;

  const initial = useMemo(() => fromExisting(existing), [existing]);
  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [sizeChartOpen, setSizeChartOpen] = useState<boolean>(Boolean(initial.sizeChartImage));
  const [activeSection, setActiveSection] = useState<SectionId>('basics');

  const isDirty = useMemo(
    () => JSON.stringify(values) !== initialJson,
    [values, initialJson]
  );
  const hasErrors = useMemo(
    () =>
      Boolean(
        errors.name ||
          errors.description ||
          errors.price ||
          errors.wholesalePrice ||
          errors.salePrice ||
          errors.saleStartDate ||
          errors.saleEndDate ||
          errors.category ||
          errors.subCategory ||
          errors.defaultImage ||
          errors.albumImages ||
          errors.variants ||
          errors.variantRows
      ),
    [errors]
  );
  const hasSale = typeof values.salePrice === 'number' && values.salePrice > 0;
  const stickyStatus: StickyActionStatus = isPending
    ? 'saving'
    : hasErrors
      ? 'error'
      : isDirty
        ? 'dirty'
        : 'idle';

  const filteredSubCategories = useMemo(() => {
    if (!values.category) return subCategoriesQuery.data ?? [];
    return (subCategoriesQuery.data ?? []).filter(
      (sc) => idOf(sc.category) === values.category
    );
  }, [values.category, subCategoriesQuery.data]);

  const sizeOptionsForGroup = useMemo(() => {
    if (!values.category) return sizesQuery.data ?? [];
    const cat = categoriesQuery.data?.find((c) => c._id === values.category);
    if (!cat) return sizesQuery.data ?? [];
    const groupId = idOf(cat.groupSize);
    return (sizesQuery.data ?? []).filter((s) => idOf(s.groupSize) === groupId);
  }, [values.category, categoriesQuery.data, sizesQuery.data]);

  const colorsById = useMemo(() => {
    const map = new Map<string, ApiColor>();
    (colorsQuery.data ?? []).forEach((c) => map.set(c._id, c));
    return map;
  }, [colorsQuery.data]);

  const subCategoryName = useMemo(() => {
    if (!values.subCategory) return null;
    const sc = (subCategoriesQuery.data ?? []).find((s) => s._id === values.subCategory);
    return sc?.name.en ?? null;
  }, [values.subCategory, subCategoriesQuery.data]);

  const totalStock = useMemo(
    () => values.variants.reduce((sum, v) => sum + (v.quantity || 0), 0),
    [values.variants]
  );

  const completion = useMemo(() => computeCompletion(values), [values]);

  const sectionState = useMemo(
    () => computeSectionState(values, errors),
    [values, errors]
  );

  const priceNum = typeof values.price === 'number' ? values.price : 0;
  const saleNum = typeof values.salePrice === 'number' ? values.salePrice : 0;
  const discountPct =
    priceNum > 0 && saleNum > 0 && saleNum < priceNum
      ? Math.round(((priceNum - saleNum) / priceNum) * 100)
      : 0;

  const now = Date.now();
  const saleIsLive =
    hasSale &&
    values.saleStartDate > 0 &&
    values.saleEndDate > 0 &&
    now >= values.saleStartDate &&
    now <= values.saleEndDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = productFormSchema.safeParse({
      ...values,
      price: numOrZero(values.price),
      wholesalePrice: numOrZero(values.wholesalePrice),
      salePrice: numOrZero(values.salePrice),
      sizeChartImage: values.sizeChartImage || undefined,
    });
    if (!parsed.success) {
      const next: ProductFormErrors = {};
      parsed.error.issues.forEach((iss) => {
        const [head, idx, leaf] = iss.path as [string, number | string, string?];
        if (head === 'name' || head === 'description') {
          const lang = idx as 'en' | 'ar';
          next[head] = { ...(next[head] ?? {}), [lang]: iss.message };
        } else if (head === 'variants' && typeof idx === 'number') {
          if (!next.variantRows) next.variantRows = {};
          if (!next.variantRows[idx]) next.variantRows[idx] = {};
          const field = leaf as 'size' | 'color' | 'quantity';
          if (field) next.variantRows[idx][field] = iss.message;
        } else if (head === 'variants') {
          next.variants = iss.message;
        } else if (head === 'albumImages') {
          next.albumImages = iss.message;
        } else if (
          head === 'price' ||
          head === 'wholesalePrice' ||
          head === 'salePrice' ||
          head === 'saleStartDate' ||
          head === 'saleEndDate' ||
          head === 'category' ||
          head === 'subCategory' ||
          head === 'defaultImage'
        ) {
          next[head] = iss.message;
        }
      });
      setErrors(next);
      return;
    }
    setErrors({});
    const payload = parsed.data;
    if (existing) {
      update.mutate(
        { id: existing._id, payload },
        { onSuccess: () => navigate({ to: ROUTES.products, search: { page: 1, search: '' } }) }
      );
    } else {
      create.mutate(payload, { onSuccess: () => navigate({ to: ROUTES.products, search: { page: 1, search: '' } }) });
    }
  };

  const setVariant = (idx: number, patch: Partial<VariantRow>) => {
    setValues((p) => ({
      ...p,
      variants: p.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
  };

  const addVariant = () =>
    setValues((p) => ({ ...p, variants: [...p.variants, { size: '', color: '', quantity: 0 }] }));

  const removeVariant = (idx: number) =>
    setValues((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));

  const handleCategoryChange = (nextCategoryId: string | undefined) => {
    setValues((p) => {
      const next = nextCategoryId ?? '';
      const currentSub = subCategoriesQuery.data?.find((sc) => sc._id === p.subCategory);
      const subStillBelongs = currentSub && idOf(currentSub.category) === next;
      return { ...p, category: next, subCategory: subStillBelongs ? p.subCategory : '' };
    });
  };

  // Cmd/Ctrl+S to submit — matches the keyboard-shortcut spec for form pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, existing]);

  // Track active section in the rail
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const ob = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
      );
      ob.observe(el);
      observers.push(ob);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      <PageHeader
        title={isEdit ? existing?.name.en || 'Edit product' : 'New product'}
        breadcrumbLabel={
          isEdit
            ? existing?.name.en
              ? `Edit: ${existing.name.en}`
              : undefined
            : 'New product'
        }
        subtitle={
          isEdit
            ? 'Update details, swap images, or adjust variants.'
            : 'Set up the basics, pick classification, and add at least one variant.'
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: ROUTES.products, search: { page: 1, search: '' } })}>
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
              Back
            </Button>
            {isEdit && existing ? (
              <Button
                variant="outline"
                onClick={() =>
                  navigate({ to: ROUTES.productVariants(existing._id) })
                }
              >
                <Boxes size={16} strokeWidth={1.5} aria-hidden />
                Manage variants
              </Button>
            ) : null}
          </div>
        }
      />

      {isEdit && existing ? (
        <FadeUp>
          <ProductMetaStrip
            defaultImage={values.defaultImage}
            subCategoryName={subCategoryName}
            variantsCount={values.variants.length}
            totalStock={totalStock}
            saleIsLive={saleIsLive}
            discountPct={discountPct}
          />
        </FadeUp>
      ) : null}

      <CompletionMeter
        pct={completion.pct}
        completed={completion.done}
        total={completion.total}
        hideWhenFull={isEdit}
      />

      <form
        onSubmit={handleSubmit}
        className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        <aside className="hidden xl:col-span-2 xl:block">
          <SectionRail activeId={activeSection} state={sectionState} />
        </aside>

        <div className="space-y-6 lg:col-span-8 xl:col-span-7">
          <FadeUp delay={0.04}>
            <section
              id="basics"
              aria-labelledby="basics-title"
              className="scroll-mt-28"
            >
              <Card padding="lg">
                <SectionHeader
                  icon={Tag}
                  title="Basics"
                  subtitle="What customers see at a glance."
                  titleId="basics-title"
                />
                <div className="mt-5 space-y-5">
                  <BilingualInput
                    label="Name"
                    required
                    value={values.name}
                    onChange={(name) => setValues((p) => ({ ...p, name }))}
                    error={errors.name}
                    placeholder={{ en: 'Cotton pants', ar: 'بنطلون قطني' }}
                  />
                  <BilingualInput
                    label="Description"
                    required
                    multiline
                    value={values.description}
                    onChange={(description) => setValues((p) => ({ ...p, description }))}
                    error={errors.description}
                    placeholder={{
                      en: 'Comfortable cotton pants for daily use',
                      ar: 'بنطلون قطني مريح للاستخدام اليومي',
                    }}
                  />
                </div>
              </Card>
            </section>
          </FadeUp>

          <FadeUp delay={0.08}>
            <section
              id="pricing"
              aria-labelledby="pricing-title"
              className="scroll-mt-28"
            >
              <Card padding="lg">
                <SectionHeader
                  icon={Tag}
                  title="Pricing"
                  subtitle="List price, wholesale, and an optional sale window."
                  titleId="pricing-title"
                  trailing={
                    <PricePreview
                      price={priceNum}
                      salePrice={saleNum}
                      discountPct={discountPct}
                    />
                  }
                />

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AdminFormField label="Price" required error={errors.price}>
                    <NumberInput
                      value={values.price}
                      onChange={(v) => setValues((p) => ({ ...p, price: v }))}
                      suffix="EGP"
                      clampMin={0}
                      hasError={Boolean(errors.price)}
                    />
                  </AdminFormField>
                  <AdminFormField label="Wholesale price" required error={errors.wholesalePrice}>
                    <NumberInput
                      value={values.wholesalePrice}
                      onChange={(v) => setValues((p) => ({ ...p, wholesalePrice: v }))}
                      suffix="EGP"
                      clampMin={0}
                      hasError={Boolean(errors.wholesalePrice)}
                    />
                  </AdminFormField>
                </div>

                <div
                  className={cn(
                    'mt-4 rounded-xl border border-border bg-muted/40 p-4 transition-opacity',
                    !hasSale && 'opacity-70'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Sale window
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {hasSale
                          ? 'Customers see the sale price during this window.'
                          : 'Set a sale price above to unlock the schedule.'}
                      </p>
                    </div>
                    {saleIsLive ? (
                      <GenericBadge label="Live now" tone="accent" size="sm" />
                    ) : hasSale ? (
                      <GenericBadge label="Scheduled" tone="muted" size="sm" />
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <AdminFormField
                      label="Sale price"
                      hint="Leave 0 to disable the sale."
                      error={errors.salePrice}
                    >
                      <NumberInput
                        value={values.salePrice}
                        onChange={(v) => setValues((p) => ({ ...p, salePrice: v }))}
                        suffix="EGP"
                        clampMin={0}
                        hasError={Boolean(errors.salePrice)}
                      />
                    </AdminFormField>
                    <AdminFormField label="Sale start" error={errors.saleStartDate}>
                      <DateInput
                        value={values.saleStartDate}
                        onChange={(v) => setValues((p) => ({ ...p, saleStartDate: v }))}
                        hasError={Boolean(errors.saleStartDate)}
                        disabled={!hasSale || isPending}
                      />
                    </AdminFormField>
                    <AdminFormField label="Sale end" error={errors.saleEndDate}>
                      <DateInput
                        value={values.saleEndDate}
                        onChange={(v) => setValues((p) => ({ ...p, saleEndDate: v }))}
                        hasError={Boolean(errors.saleEndDate)}
                        disabled={!hasSale || isPending}
                      />
                    </AdminFormField>
                  </div>
                </div>
              </Card>
            </section>
          </FadeUp>

          <FadeUp delay={0.12}>
            <section
              id="classification"
              aria-labelledby="classification-title"
              className="scroll-mt-28"
            >
              <Card padding="lg">
                <SectionHeader
                  icon={Layers}
                  title="Classification"
                  subtitle="Where this product lives in the catalog."
                  titleId="classification-title"
                />
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AdminFormField label="Category" required error={errors.category}>
                    <SearchableSelect<ApiCategory>
                      value={values.category || undefined}
                      onChange={handleCategoryChange}
                      items={(categoriesQuery.data ?? []).filter((c) => !c.isDeleted)}
                      getKey={(c) => c._id}
                      getLabel={(c) => c.name.en}
                      placeholder="Pick a category"
                      disabled={isPending}
                      clearable={false}
                    />
                  </AdminFormField>
                  <AdminFormField label="Sub-category" required error={errors.subCategory}>
                    <SearchableSelect<ApiSubCategory>
                      value={values.subCategory || undefined}
                      onChange={(v) => setValues((p) => ({ ...p, subCategory: v ?? '' }))}
                      items={filteredSubCategories.filter((sc) => !sc.isDeleted)}
                      getKey={(sc) => sc._id}
                      getLabel={(sc) => sc.name.en}
                      placeholder={
                        values.category ? 'Pick a sub-category' : 'Pick a category first'
                      }
                      disabled={isPending || !values.category}
                      clearable={false}
                    />
                  </AdminFormField>
                </div>
              </Card>
            </section>
          </FadeUp>

          <FadeUp delay={0.16}>
            <section
              id="variants"
              aria-labelledby="variants-title"
              className="scroll-mt-28"
            >
              <Card padding="lg">
                <SectionHeader
                  icon={Boxes}
                  title="Variants"
                  subtitle="Every size + color combination customers can buy."
                  titleId="variants-title"
                  trailing={
                    <div className="flex items-center gap-3">
                      {values.variants.length > 0 ? (
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          <span className="font-semibold text-foreground tabular-nums">
                            {values.variants.length}
                          </span>{' '}
                          variants ·{' '}
                          <span className="font-semibold text-foreground tabular-nums">
                            {totalStock}
                          </span>{' '}
                          units
                        </span>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVariant}
                        disabled={isPending}
                      >
                        <Plus size={14} strokeWidth={1.5} aria-hidden />
                        Add variant
                      </Button>
                    </div>
                  }
                />

                {errors.variants ? (
                  <p className="mt-3 text-xs text-destructive">{errors.variants}</p>
                ) : null}

                <div className="mt-5">
                  {values.variants.length === 0 ? (
                    <VariantsEmptyState onAdd={addVariant} disabled={isPending} />
                  ) : (
                    <ul className="space-y-2">
                      <AnimatePresence initial={false}>
                        {values.variants.map((variant, idx) => (
                          <VariantRowItem
                            key={idx}
                            idx={idx}
                            variant={variant}
                            rowErrs={errors.variantRows?.[idx]}
                            sizeOptions={sizeOptionsForGroup}
                            colors={colorsQuery.data ?? []}
                            colorMeta={colorsById.get(variant.color)}
                            isPending={isPending}
                            setVariant={setVariant}
                            onRemove={() => removeVariant(idx)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>
              </Card>
            </section>
          </FadeUp>
        </div>

        <aside className="space-y-6 lg:col-span-4 xl:col-span-3">
          <FadeUp delay={0.04}>
            <section
              id="media"
              aria-labelledby="media-title"
              className="scroll-mt-28"
            >
              <Card padding="lg">
                <SectionHeader
                  icon={ImageIcon}
                  title="Media"
                  subtitle="Hero shot, gallery, and an optional size chart."
                  titleId="media-title"
                />

                <div className="mt-5 space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                        Hero
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Shown in product cards
                      </p>
                    </div>
                    <AdminImageUploader
                      folder="Product"
                      value={values.defaultImage || undefined}
                      onChange={(defaultImage) => setValues((p) => ({ ...p, defaultImage }))}
                      onClear={() => setValues((p) => ({ ...p, defaultImage: '' }))}
                      disabled={isPending}
                      hasError={Boolean(errors.defaultImage)}
                      aspectRatio="4 / 5"
                    />
                    {errors.defaultImage ? (
                      <p className="mt-1 text-xs text-destructive">{errors.defaultImage}</p>
                    ) : null}
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Gallery
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {values.albumImages.length} / 10
                      </p>
                    </div>
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      Drag to reorder. First image leads the gallery.
                    </p>
                    <AdminImageUploaderMulti
                      folder="Product"
                      values={values.albumImages}
                      onChange={(albumImages) => setValues((p) => ({ ...p, albumImages }))}
                      max={10}
                    />
                    {errors.albumImages ? (
                      <p className="mt-2 text-xs text-destructive">{errors.albumImages}</p>
                    ) : null}
                  </div>

                  <div className="border-t border-border pt-5">
                    <button
                      type="button"
                      onClick={() => setSizeChartOpen((s) => !s)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-expanded={sizeChartOpen}
                    >
                      <span className="flex items-center gap-2">
                        <Ruler size={14} strokeWidth={1.75} className="text-muted-foreground group-hover:text-accent" aria-hidden />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground group-hover:text-accent">
                          Size chart
                        </span>
                        <span className="text-[11px] text-muted-foreground">(optional)</span>
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        aria-hidden
                        className={cn(
                          'text-muted-foreground transition-transform',
                          sizeChartOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {sizeChartOpen ? (
                        <motion.div
                          key="size-chart"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            <AdminImageUploader
                              folder="Product"
                              value={values.sizeChartImage || undefined}
                              onChange={(sizeChartImage) =>
                                setValues((p) => ({ ...p, sizeChartImage }))
                              }
                              onClear={() => setValues((p) => ({ ...p, sizeChartImage: '' }))}
                              disabled={isPending}
                              aspectRatio="4 / 5"
                            />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            </section>
          </FadeUp>
        </aside>
      </form>

      {/* Clearance for sticky action bar (new product → always; edit → only when dirty) */}
      <div aria-hidden className="h-24" />

      <StickyActionBar
        open={!isEdit || isDirty || isPending}
        status={stickyStatus}
        statusLabel={
          hasErrors
            ? 'Fix the highlighted fields'
            : isPending
              ? isEdit
                ? 'Saving changes…'
                : 'Creating product…'
              : isEdit
                ? isDirty
                  ? 'Unsaved changes'
                  : 'All changes saved'
                : 'New product — fill the form to create'
        }
        secondary={
          isEdit ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setValues(initial)}
              disabled={!isDirty || isPending}
            >
              Discard
            </Button>
          ) : null
        }
        primary={
          <Button onClick={handleSubmit} isLoading={isPending} disabled={isEdit && !isDirty}>
            {isEdit ? 'Save changes' : 'Create product'}
            <Kbd className="ml-2 hidden sm:inline-flex">⌘S</Kbd>
          </Button>
        }
      />
    </>
  );
}

/* ─────────────── Local subcomponents ─────────────── */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  trailing,
  titleId,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean; className?: string }>;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  titleId?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"
        >
          <Icon size={15} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

function ProductMetaStrip({
  defaultImage,
  subCategoryName,
  variantsCount,
  totalStock,
  saleIsLive,
  discountPct,
}: {
  defaultImage: string;
  subCategoryName: string | null;
  variantsCount: number;
  totalStock: number;
  saleIsLive: boolean;
  discountPct: number;
}) {
  const stockTone: 'success' | 'warning' | 'destructive' =
    totalStock === 0 ? 'destructive' : totalStock < 10 ? 'warning' : 'success';
  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent-soft via-card to-card p-4 sm:p-5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {defaultImage ? (
            <img
              src={defaultImage}
              alt=""
              className="h-20 w-16 object-cover sm:h-24 sm:w-20"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-20 w-16 items-center justify-center text-muted-foreground sm:h-24 sm:w-20">
              <ImageIcon size={20} strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {subCategoryName ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {subCategoryName}
              </span>
            ) : null}
            {saleIsLive ? (
              <GenericBadge
                label={discountPct > 0 ? `−${discountPct}% on sale` : 'On sale'}
                tone="accent"
                size="sm"
              />
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <GenericBadge
              label={
                totalStock === 0
                  ? 'Out of stock'
                  : `${totalStock.toLocaleString('en-US')} in stock`
              }
              tone={stockTone}
              size="sm"
            />
            <GenericBadge
              label={`${variantsCount} variant${variantsCount === 1 ? '' : 's'}`}
              tone="muted"
              size="sm"
              icon={Boxes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletionMeter({
  pct,
  completed,
  total,
  hideWhenFull,
}: {
  pct: number;
  completed: number;
  total: number;
  hideWhenFull: boolean;
}) {
  if (hideWhenFull && pct === 100) return null;
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
        {completed} / {total} required
      </span>
    </div>
  );
}

function SectionRail({
  activeId,
  state,
}: {
  activeId: SectionId;
  state: Record<SectionId, 'idle' | 'done' | 'error'>;
}) {
  return (
    <nav
      aria-label="Form sections"
      className="sticky top-24 rounded-2xl border border-border bg-card p-3"
    >
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Sections
      </p>
      <ul className="space-y-0.5">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          const status = state[s.id];
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(s.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card transition-colors',
                    status === 'error'
                      ? 'bg-destructive ring-destructive/30'
                      : status === 'done'
                        ? 'bg-accent ring-accent/30'
                        : 'bg-transparent ring-border-strong'
                  )}
                />
                <span className="font-medium">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PricePreview({
  price,
  salePrice,
  discountPct,
}: {
  price: number;
  salePrice: number;
  discountPct: number;
}) {
  if (price <= 0) return null;
  const onSale = salePrice > 0 && salePrice < price;
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Customer pays
      </span>
      {onSale ? (
        <>
          <span className="text-xs text-muted-foreground line-through tabular-nums">
            {formatEGP(price)}
          </span>
          <span className="text-sm font-semibold text-accent tabular-nums">
            {formatEGP(salePrice)}
          </span>
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent tabular-nums">
            −{discountPct}%
          </span>
        </>
      ) : (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatEGP(price)}
        </span>
      )}
    </div>
  );
}

function VariantsEmptyState({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-medium bg-muted/30 px-6 py-10 text-center">
      <span
        aria-hidden
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <Boxes size={20} strokeWidth={1.5} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">No variants yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Add at least one size + color combination so this product can be purchased.
      </p>
      <Button type="button" size="sm" onClick={onAdd} disabled={disabled} className="mt-4">
        <Plus size={14} strokeWidth={1.5} aria-hidden />
        Add first variant
      </Button>
    </div>
  );
}

function VariantRowItem({
  idx,
  variant,
  rowErrs,
  sizeOptions,
  colors,
  colorMeta,
  isPending,
  setVariant,
  onRemove,
}: {
  idx: number;
  variant: VariantRow;
  rowErrs?: { size?: string; color?: string; quantity?: string };
  sizeOptions: ApiSize[];
  colors: ApiColor[];
  colorMeta?: ApiColor;
  isPending: boolean;
  setVariant: (idx: number, patch: Partial<VariantRow>) => void;
  onRemove: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const hex = colorMeta?.hex || '#E5E0DD';
  const textTone = contrastTone(hex);
  return (
    <motion.li
      layout
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group/row flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-border-medium"
    >
      <span
        aria-hidden
        className="hidden cursor-grab self-center text-muted-foreground/60 sm:inline-flex"
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </span>

      <div
        aria-hidden
        className="relative hidden h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border sm:inline-flex"
        style={{ backgroundColor: hex }}
      >
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wide tabular-nums',
            textTone === 'dark' ? 'text-foreground/80' : 'text-white/90'
          )}
        >
          {variant.size || '—'}
        </span>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-12 items-start gap-2">
        <div className="col-span-6 md:col-span-3">
          {sizeOptions.length > 0 ? (
            <SearchableSelect<ApiSize>
              value={variant.size || undefined}
              onChange={(v) => setVariant(idx, { size: v ?? '' })}
              items={sizeOptions}
              getKey={(s) => s.size}
              getLabel={(s) => s.size}
              placeholder="Size"
              disabled={isPending}
              clearable={false}
              hasError={Boolean(rowErrs?.size)}
            />
          ) : (
            <Input
              value={variant.size}
              onChange={(e) => setVariant(idx, { size: e.target.value })}
              placeholder="Size (e.g. m)"
              hasError={Boolean(rowErrs?.size)}
              disabled={isPending}
            />
          )}
          {rowErrs?.size ? (
            <p className="mt-1 text-[11px] text-destructive">{rowErrs.size}</p>
          ) : null}
        </div>

        <div className="col-span-6 md:col-span-5">
          <SearchableSelect<ApiColor>
            value={variant.color || undefined}
            onChange={(v) => setVariant(idx, { color: v ?? '' })}
            items={colors}
            getKey={(c) => c._id}
            getLabel={(c) => c.name.en}
            renderItem={(c) => (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden
                />
                {c.name.en}
              </span>
            )}
            placeholder="Color"
            disabled={isPending}
            clearable={false}
            hasError={Boolean(rowErrs?.color)}
          />
          {rowErrs?.color ? (
            <p className="mt-1 text-[11px] text-destructive">{rowErrs.color}</p>
          ) : null}
        </div>

        <div className="col-span-8 md:col-span-3">
          <NumberInput
            value={variant.quantity}
            onChange={(v) =>
              setVariant(idx, { quantity: typeof v === 'number' ? v : 0 })
            }
            suffix="qty"
            clampMin={0}
            hasError={Boolean(rowErrs?.quantity)}
            disabled={isPending}
          />
          {rowErrs?.quantity ? (
            <p className="mt-1 text-[11px] text-destructive">{rowErrs.quantity}</p>
          ) : (
            <div className="mt-1.5">
              <StockPill qty={variant.quantity} />
            </div>
          )}
        </div>

        <div className="col-span-4 flex justify-end md:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label="Remove variant"
            disabled={isPending}
          >
            <Trash2 size={14} strokeWidth={1.5} className="text-destructive" />
          </Button>
        </div>
      </div>
    </motion.li>
  );
}

function StockPill({ qty }: { qty: number }) {
  if (qty <= 0) return <GenericBadge label="Out of stock" tone="destructive" size="sm" />;
  if (qty < 5) return <GenericBadge label={`Low · ${qty}`} tone="warning" size="sm" />;
  return <GenericBadge label={`${qty} ready`} tone="success" size="sm" />;
}

/* ─────────────── Helpers ─────────────── */

function contrastTone(hex: string): 'light' | 'dark' {
  const h = hex.replace('#', '');
  if (h.length < 6) return 'dark';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return 'dark';
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? 'dark' : 'light';
}

function computeCompletion(v: FormState): { done: number; total: number; pct: number } {
  const checks = [
    Boolean(v.name.en && v.name.ar),
    Boolean(v.description.en && v.description.ar),
    typeof v.price === 'number' && v.price > 0,
    typeof v.wholesalePrice === 'number' && v.wholesalePrice > 0,
    Boolean(v.category),
    Boolean(v.subCategory),
    Boolean(v.defaultImage),
    v.variants.length > 0 &&
      v.variants.every((x) => x.size && x.color && x.quantity >= 0),
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

function computeSectionState(
  v: FormState,
  errs: ProductFormErrors
): Record<SectionId, 'idle' | 'done' | 'error'> {
  const basicsDone = Boolean(v.name.en && v.name.ar && v.description.en && v.description.ar);
  const basicsErr = Boolean(errs.name || errs.description);
  const pricingDone =
    typeof v.price === 'number' && v.price > 0 &&
    typeof v.wholesalePrice === 'number' && v.wholesalePrice > 0;
  const pricingErr = Boolean(
    errs.price || errs.wholesalePrice || errs.salePrice || errs.saleStartDate || errs.saleEndDate
  );
  const classDone = Boolean(v.category && v.subCategory);
  const classErr = Boolean(errs.category || errs.subCategory);
  const variantsDone =
    v.variants.length > 0 && v.variants.every((x) => x.size && x.color);
  const variantsErr = Boolean(errs.variants || errs.variantRows);
  const mediaDone = Boolean(v.defaultImage);
  const mediaErr = Boolean(errs.defaultImage || errs.albumImages);
  return {
    basics: basicsErr ? 'error' : basicsDone ? 'done' : 'idle',
    pricing: pricingErr ? 'error' : pricingDone ? 'done' : 'idle',
    classification: classErr ? 'error' : classDone ? 'done' : 'idle',
    variants: variantsErr ? 'error' : variantsDone ? 'done' : 'idle',
    media: mediaErr ? 'error' : mediaDone ? 'done' : 'idle',
  };
}

function fromExisting(p: ApiProduct | null): FormState {
  if (!p) {
    return {
      name: emptyBilingual(),
      description: emptyBilingual(),
      price: '',
      wholesalePrice: '',
      salePrice: 0,
      saleStartDate: 0,
      saleEndDate: 0,
      category: '',
      subCategory: '',
      defaultImage: '',
      albumImages: [],
      sizeChartImage: '',
      variants: [],
    };
  }
  return {
    name: p.name,
    description: p.description,
    price: p.price,
    wholesalePrice: p.wholesalePrice,
    salePrice: p.salePrice,
    saleStartDate: p.saleStartDate,
    saleEndDate: p.saleEndDate,
    category: idOf(p.category),
    subCategory: idOf(p.subCategory),
    defaultImage: p.defaultImage?.mediaUrl ?? '',
    albumImages: (p.albumImages ?? []).map((m) => m.mediaUrl),
    sizeChartImage: p.sizeChartImage?.mediaUrl ?? '',
    variants: (p.variants ?? []).map((v) => ({
      size: v.size,
      color: idOf(v.color),
      quantity: v.quantity,
    })),
  };
}

function numOrZero(v: number | ''): number {
  return v === '' ? 0 : v;
}
