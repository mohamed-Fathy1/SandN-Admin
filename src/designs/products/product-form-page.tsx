import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Boxes,
  Check,
  ChevronDown,
  ImageIcon,
  Plus,
  Ruler,
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
  Eyebrow,
  FadeUp,
  FormSkeleton,
  GenericBadge,
  Kbd,
  NumberInput,
  NotFoundState,
  QueryErrorState,
  SearchableSelect,
  StickyActionBar,
  type StickyActionStatus,
  Switch,
  usePrefersReducedMotion,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { CURRENCY_SUFFIX, ROUTES } from '@/config/constants';
import { mapApiErrorsToFields } from '@/shared/utils/forms';
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
  isBestSeller: boolean;
  isNewArrival: boolean;
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

  if (isEdit && productQuery.isPending) {
    return (
      <>
        <PageHeader
          title="Edit product"
          breadcrumbLabel="Loading…"
          subtitle="Fetching catalog details."
        />
        <Card>
          <FormSkeleton fields={6} />
        </Card>
      </>
    );
  }
  if (isEdit && productQuery.isError) {
    if (isNotFoundError(productQuery.error)) {
      return (
        <NotFoundState
          error={productQuery.error}
          onBack={() => navigate({ to: ROUTES.products, search: { page: 1, search: '', tab: 'active', flags: [] } })}
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
  { id: 'classification', label: 'Catalog' },
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
  const justSavedRef = useRef(false);

  useBlocker({
    shouldBlockFn: () => {
      if (justSavedRef.current) return false;
      if (!isDirty) return false;
      return !window.confirm(
        'You have unsaved changes. Leave this page and discard them?'
      );
    },
    enableBeforeUnload: () => isDirty && !justSavedRef.current,
  });
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

  const subCategoryName = useMemo(() => {
    if (!values.subCategory) return null;
    const sc = (subCategoriesQuery.data ?? []).find((s) => s._id === values.subCategory);
    return sc?.name.en ?? null;
  }, [values.subCategory, subCategoriesQuery.data]);

  const totalStock = useMemo(
    () => values.variants.reduce((sum, v) => sum + (v.quantity || 0), 0),
    [values.variants]
  );

  const sectionState = useMemo(
    () => computeSectionState(values, errors),
    [values, errors]
  );

  const saleScheduled =
    hasSale && values.saleStartDate > 0 && values.saleEndDate > 0;

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
    const payload = {
      ...parsed.data,
      sizeChartImage:
        parsed.data.sizeChartImage && parsed.data.sizeChartImage.length > 0
          ? parsed.data.sizeChartImage
          : isEdit
            ? null
            : undefined,
      isBestSeller: isEdit ? values.isBestSeller : undefined,
      isNewArrival: isEdit ? values.isNewArrival : undefined,
    };
    const onSavedSuccess = () => {
      justSavedRef.current = true;
      navigate({
        to: ROUTES.products,
        search: { page: 1, search: '', tab: 'active', flags: [] },
      });
    };
    const onSavedError = (err: unknown) => {
      const fieldMap = mapApiErrorsToFields(err);
      if (!fieldMap) return;
      const next: ProductFormErrors = {};
      for (const [path, msg] of Object.entries(fieldMap)) {
        const parts = path.split('.');
        const [head, idx, leaf] = parts;
        if (head === 'name' || head === 'description') {
          const lang = idx as 'en' | 'ar';
          if (lang === 'en' || lang === 'ar') {
            next[head] = { ...(next[head] ?? {}), [lang]: msg };
          }
        } else if (head === 'variants' && /^\d+$/.test(idx ?? '')) {
          const rowIdx = Number(idx);
          const field = leaf as 'size' | 'color' | 'quantity' | undefined;
          if (!next.variantRows) next.variantRows = {};
          if (!next.variantRows[rowIdx]) next.variantRows[rowIdx] = {};
          if (field === 'size' || field === 'color' || field === 'quantity') {
            next.variantRows[rowIdx][field] = msg;
          }
        } else if (head === 'variants') {
          next.variants = msg;
        } else if (head === 'albumImages') {
          next.albumImages = msg;
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
          next[head] = msg;
        }
      }
      setErrors(next);
    };
    if (existing) {
      update.mutate(
        { id: existing._id, payload },
        { onSuccess: onSavedSuccess, onError: onSavedError }
      );
    } else {
      create.mutate(payload, { onSuccess: onSavedSuccess, onError: onSavedError });
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

  // Track active section in the stepper
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
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: ROUTES.products, search: { page: 1, search: '', tab: 'active', flags: [] } })}>
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
            totalStock={totalStock}
          />
        </FadeUp>
      ) : null}

      <ProgressStepper activeId={activeSection} state={sectionState} />

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        <FadeUp delay={0.04}>
          <SectionBlock
            id="basics"
            title="Basics"
            subtitle="Name and description, in both languages."
            titleId="basics-title"
          >
            <div className="space-y-5">
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
          </SectionBlock>
        </FadeUp>

        <FadeUp delay={0.08}>
          <SectionBlock
            id="pricing"
            title="Pricing"
            subtitle="Set price, wholesale, and an optional sale."
            titleId="pricing-title"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AdminFormField label="Price" required error={errors.price}>
                <NumberInput
                  value={values.price}
                  onChange={(v) => setValues((p) => ({ ...p, price: v }))}
                  suffix={CURRENCY_SUFFIX}
                  clampMin={0}
                  hasError={Boolean(errors.price)}
                />
              </AdminFormField>
              <AdminFormField label="Wholesale price" required error={errors.wholesalePrice}>
                <NumberInput
                  value={values.wholesalePrice}
                  onChange={(v) => setValues((p) => ({ ...p, wholesalePrice: v }))}
                  suffix={CURRENCY_SUFFIX}
                  clampMin={0}
                  hasError={Boolean(errors.wholesalePrice)}
                />
              </AdminFormField>
            </div>

            <SalePanel
              hasSale={hasSale}
              saleScheduled={saleScheduled}
              values={values}
              errors={errors}
              isPending={isPending}
              setValues={setValues}
            />
          </SectionBlock>
        </FadeUp>

        <FadeUp delay={0.12}>
          <SectionBlock
            id="classification"
            title="Catalog"
            subtitle="Where this product lives in the storefront."
            titleId="classification-title"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </SectionBlock>
        </FadeUp>

        {isEdit ? (
          <FadeUp delay={0.14}>
            <SectionBlock
              id="flags"
              title="Storefront flags"
              subtitle="Toggle merchandising badges shown to customers."
              titleId="flags-title"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FlagRow
                  label="Best seller"
                  description="Pin this product to the Best Sellers strip."
                  checked={values.isBestSeller}
                  onChange={(v) => setValues((p) => ({ ...p, isBestSeller: v }))}
                  disabled={isPending}
                />
                <FlagRow
                  label="New arrival"
                  description="Show the 'New' badge and surface in the new arrivals strip."
                  checked={values.isNewArrival}
                  onChange={(v) => setValues((p) => ({ ...p, isNewArrival: v }))}
                  disabled={isPending}
                />
              </div>
            </SectionBlock>
          </FadeUp>
        ) : null}

        <FadeUp delay={0.16}>
          <SectionBlock
            id="variants"
            title="Variants"
            subtitle="Every size + color combination customers can buy."
            titleId="variants-title"
            trailing={
              values.variants.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  disabled={isPending}
                >
                  <Plus size={14} strokeWidth={1.5} aria-hidden />
                  Add
                </Button>
              ) : null
            }
          >
            {errors.variants ? (
              <p className="mb-3 text-xs text-destructive">{errors.variants}</p>
            ) : null}

            {values.variants.length === 0 ? (
              <VariantsEmptyState onAdd={addVariant} disabled={isPending} />
            ) : (
              <>
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
                        hasCategory={Boolean(values.category)}
                        isPending={isPending}
                        setVariant={setVariant}
                        onRemove={() => removeVariant(idx)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>

                <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {values.variants.length}
                  </span>{' '}
                  variants ·{' '}
                  <span className="font-semibold text-foreground tabular-nums">
                    {totalStock.toLocaleString('en-US')}
                  </span>{' '}
                  in stock
                </p>
              </>
            )}
          </SectionBlock>
        </FadeUp>

        <FadeUp delay={0.2}>
          <SectionBlock
            id="media"
            title="Media"
            subtitle="Hero shot, gallery, and an optional size chart."
            titleId="media-title"
          >
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Eyebrow>Hero image</Eyebrow>
                  <span className="text-xs text-muted-foreground">Shown in product cards</span>
                </div>
                <div className="max-w-sm">
                  <AdminImageUploader
                    folder="Product"
                    value={values.defaultImage || undefined}
                    onChange={(defaultImage) => setValues((p) => ({ ...p, defaultImage }))}
                    onClear={() => setValues((p) => ({ ...p, defaultImage: '' }))}
                    disabled={isPending}
                    hasError={Boolean(errors.defaultImage)}
                    aspectRatio="4 / 5"
                  />
                </div>
                {errors.defaultImage ? (
                  <p className="mt-2 text-xs text-destructive">{errors.defaultImage}</p>
                ) : null}
              </div>

              <div className="border-t border-border pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <Eyebrow>Gallery</Eyebrow>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {values.albumImages.length} / 10
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  First image leads the gallery.
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

              <div className="border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setSizeChartOpen((s) => !s)}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={sizeChartOpen}
                >
                  <span className="flex items-center gap-2">
                    <Ruler size={14} strokeWidth={1.75} className="text-muted-foreground group-hover:text-accent" aria-hidden />
                    <Eyebrow>Size chart</Eyebrow>
                    <span className="text-xs text-muted-foreground">(optional)</span>
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
                      <div className="max-w-sm pt-3">
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
          </SectionBlock>
        </FadeUp>
      </form>

      {/* Clearance for sticky action bar */}
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

/* ─────────────── Section block ─────────────── */

function SectionBlock({
  id,
  title,
  subtitle,
  titleId,
  trailing,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  titleId?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-28">
      <Card padding="lg" elevation="sm">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4 sm:pb-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold leading-tight text-foreground sm:text-xl"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </header>
        <div className="pt-5 sm:pt-6">{children}</div>
      </Card>
    </section>
  );
}


/* ─────────────── Progress stepper ─────────────── */

function ProgressStepper({
  activeId,
  state,
}: {
  activeId: SectionId;
  state: Record<SectionId, 'idle' | 'done' | 'error'>;
}) {
  return (
    <nav aria-label="Form sections" className="mx-auto mb-6 max-w-3xl sm:mb-8">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-max items-center sm:min-w-0">
          {SECTIONS.map((s, i) => {
            const isActive = s.id === activeId;
            const status = state[s.id];
            const isDone = status === 'done';
            const isError = status === 'error';
            return (
              <li key={s.id} className="flex flex-1 items-center">
                <a
                  href={`#${s.id}`}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(s.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'group inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-accent'
                      : isError
                        ? 'text-destructive'
                        : isDone
                          ? 'text-foreground hover:text-accent'
                          : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-colors',
                      isDone
                        ? 'bg-accent text-white'
                        : isError
                          ? 'bg-destructive text-white'
                          : isActive
                            ? 'border border-accent text-accent ring-4 ring-accent/10'
                            : 'border border-border-strong text-muted-foreground'
                    )}
                  >
                    {isDone ? (
                      <Check size={10} strokeWidth={3} aria-hidden />
                    ) : isError ? (
                      '!'
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </a>
                {i < SECTIONS.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      'mx-1.5 h-px flex-1 transition-colors sm:mx-2',
                      isDone ? 'bg-accent/40' : 'bg-border'
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/* ─────────────── Product meta strip (edit only) ─────────────── */

function ProductMetaStrip({
  defaultImage,
  subCategoryName,
  totalStock,
}: {
  defaultImage: string;
  subCategoryName: string | null;
  totalStock: number;
}) {
  const stockTone: 'success' | 'warning' | 'destructive' =
    totalStock === 0 ? 'destructive' : totalStock < 10 ? 'warning' : 'success';
  return (
    <div
      className="mx-auto mb-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {defaultImage ? (
            <img
              src={defaultImage}
              alt=""
              className="h-16 w-14 object-cover sm:h-20 sm:w-16"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-16 w-14 items-center justify-center text-muted-foreground sm:h-20 sm:w-16">
              <ImageIcon size={18} strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {subCategoryName ? (
            <Eyebrow as="p" className="truncate">{subCategoryName}</Eyebrow>
          ) : null}
          <div className="mt-1.5">
            <GenericBadge
              label={
                totalStock === 0
                  ? 'Out of stock'
                  : `${totalStock.toLocaleString('en-US')} in stock`
              }
              tone={stockTone}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Sale panel ─────────────── */

function SalePanel({
  hasSale,
  saleScheduled,
  values,
  errors,
  isPending,
  setValues,
}: {
  hasSale: boolean;
  saleScheduled: boolean;
  values: FormState;
  errors: ProductFormErrors;
  isPending: boolean;
  setValues: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div
      className={cn(
        'relative mt-6 rounded-xl border-l-2 p-4 transition-colors sm:p-5',
        hasSale
          ? 'border-l-accent bg-accent-soft/60'
          : 'border-l-border-medium bg-muted/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{hasSale ? 'Sale window' : 'Plan a sale'}</Eyebrow>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasSale
              ? 'Customers see the sale price during the window below.'
              : 'Add a sale price to schedule a window — list price stays live until then.'}
          </p>
        </div>
        {hasSale ? (
          saleScheduled ? (
            <GenericBadge label="Scheduled" tone="accent" size="sm" />
          ) : (
            <GenericBadge label="Dates pending" tone="warning" size="sm" />
          )
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminFormField
          label="Sale price"
          hint="Leave 0 to disable."
          error={errors.salePrice}
        >
          <NumberInput
            value={values.salePrice}
            onChange={(v) => setValues((p) => ({ ...p, salePrice: v }))}
            suffix={CURRENCY_SUFFIX}
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
  );
}

/* ─────────────── Variants ─────────────── */

function VariantsEmptyState({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-medium bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">No variants yet.</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Add at least one size + color combination so this product can be sold.
          </p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={disabled} className="shrink-0">
          <Plus size={14} strokeWidth={1.5} aria-hidden />
          Add first variant
        </Button>
      </div>
    </div>
  );
}

function VariantRowItem({
  idx,
  variant,
  rowErrs,
  sizeOptions,
  colors,
  hasCategory,
  isPending,
  setVariant,
  onRemove,
}: {
  idx: number;
  variant: VariantRow;
  rowErrs?: { size?: string; color?: string; quantity?: string };
  sizeOptions: ApiSize[];
  colors: ApiColor[];
  hasCategory: boolean;
  isPending: boolean;
  setVariant: (idx: number, patch: Partial<VariantRow>) => void;
  onRemove: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const hasRowErr = Boolean(rowErrs?.size || rowErrs?.color || rowErrs?.quantity);
  return (
    <motion.li
      layout
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'group/row relative flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-border-medium',
        hasRowErr
          ? 'border-destructive/30 shadow-[inset_3px_0_0_0_var(--color-destructive)]'
          : 'border-border'
      )}
    >
      <div className="grid min-w-0 flex-1 grid-cols-12 items-start gap-2">
        <div className="col-span-12 sm:col-span-4">
          <SearchableSelect<ApiSize>
            value={variant.size || undefined}
            onChange={(v) => setVariant(idx, { size: v ?? '' })}
            items={sizeOptions}
            getKey={(s) => s.size}
            getLabel={(s) => s.size}
            placeholder={
              !hasCategory
                ? 'Pick a category first'
                : sizeOptions.length === 0
                  ? 'No sizes in this group'
                  : 'Size'
            }
            disabled={isPending || !hasCategory || sizeOptions.length === 0}
            clearable={false}
            hasError={Boolean(rowErrs?.size)}
          />
          {rowErrs?.size ? (
            <p className="mt-1 text-xs text-destructive">{rowErrs.size}</p>
          ) : hasCategory && sizeOptions.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Add sizes to this group in the Sizes page.
            </p>
          ) : null}
        </div>

        <div className="col-span-12 sm:col-span-5">
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
            <p className="mt-1 text-xs text-destructive">{rowErrs.color}</p>
          ) : null}
        </div>

        <div className="col-span-12 sm:col-span-3">
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
            <p className="mt-1 text-xs text-destructive">{rowErrs.quantity}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove variant"
        disabled={isPending}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.75} aria-hidden />
      </button>
    </motion.li>
  );
}

function FlagRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start justify-between gap-3 rounded-xl border bg-card p-4 transition-colors',
        checked
          ? 'border-accent/50 bg-accent/5'
          : 'border-border hover:border-border-medium'
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </label>
  );
}

/* ─────────────── Helpers ─────────────── */

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
      isBestSeller: false,
      isNewArrival: true,
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
    isBestSeller: p.isBestSeller ?? false,
    isNewArrival: p.isNewArrival ?? false,
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
