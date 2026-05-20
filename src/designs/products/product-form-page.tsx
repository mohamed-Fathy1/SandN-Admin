import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Boxes, Plus, Trash2 } from 'lucide-react';
import {
  AdminFormField,
  AdminImageUploader,
  AdminImageUploaderMulti,
  BilingualInput,
  Button,
  Card,
  DateInput,
  Input,
  NumberInput,
  PageSkeleton,
  QueryErrorState,
  SearchableSelect,
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
  const isEdit = Boolean(productId);
  const productQuery = useProduct(productId);

  if (isEdit && productQuery.isPending) return <PageSkeleton />;
  if (isEdit && productQuery.isError) {
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

  const [values, setValues] = useState<FormState>(() => fromExisting(existing));
  const [errors, setErrors] = useState<ProductFormErrors>({});

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

  return (
    <>
      <PageHeader
        title={isEdit ? existing?.name.en || 'Edit product' : 'New product'}
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
            <Button onClick={handleSubmit} isLoading={isPending}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg">
            <SectionTitle>Basic info</SectionTitle>
            <div className="mt-4 space-y-5">
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

          <Card padding="lg">
            <SectionTitle>Pricing</SectionTitle>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                />
              </AdminFormField>
              <AdminFormField label="Sale end" error={errors.saleEndDate}>
                <DateInput
                  value={values.saleEndDate}
                  onChange={(v) => setValues((p) => ({ ...p, saleEndDate: v }))}
                  hasError={Boolean(errors.saleEndDate)}
                />
              </AdminFormField>
            </div>
          </Card>

          <Card padding="lg">
            <SectionTitle>Classification</SectionTitle>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <Card padding="lg">
            <div className="flex items-center justify-between">
              <SectionTitle>Variants</SectionTitle>
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
            {errors.variants ? (
              <p className="mt-2 text-xs text-destructive">{errors.variants}</p>
            ) : null}
            <div className="mt-4 space-y-2">
              {values.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  At least one variant is required.
                </p>
              ) : (
                values.variants.map((variant, idx) => {
                  const rowErrs = errors.variantRows?.[idx];
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-start gap-2 rounded-xl border border-border-medium bg-card p-3"
                    >
                      <div className="col-span-12 md:col-span-3">
                        {sizeOptionsForGroup.length > 0 ? (
                          <SearchableSelect<ApiSize>
                            value={variant.size || undefined}
                            onChange={(v) => setVariant(idx, { size: v ?? '' })}
                            items={sizeOptionsForGroup}
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
                      <div className="col-span-12 md:col-span-5">
                        <SearchableSelect<ApiColor>
                          value={variant.color || undefined}
                          onChange={(v) => setVariant(idx, { color: v ?? '' })}
                          items={colorsQuery.data ?? []}
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
                      <div className="col-span-10 md:col-span-3">
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
                        ) : null}
                      </div>
                      <div className="col-span-2 md:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(idx)}
                          aria-label="Remove variant"
                          disabled={isPending}
                        >
                          <Trash2 size={14} strokeWidth={1.5} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg">
            <SectionTitle>Default image</SectionTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              The hero shot shown in product cards.
            </p>
            <div className="mt-3">
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
          </Card>

          <Card padding="lg">
            <SectionTitle>Album images</SectionTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag to reorder. The first image is shown first in the gallery.
            </p>
            <div className="mt-3">
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
          </Card>

          <Card padding="lg">
            <SectionTitle>Size chart</SectionTitle>
            <p className="mt-1 text-xs text-muted-foreground">Optional sizing reference.</p>
            <div className="mt-3">
              <AdminImageUploader
                folder="Product"
                value={values.sizeChartImage || undefined}
                onChange={(sizeChartImage) => setValues((p) => ({ ...p, sizeChartImage }))}
                onClear={() => setValues((p) => ({ ...p, sizeChartImage: '' }))}
                disabled={isPending}
                aspectRatio="4 / 5"
              />
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-foreground">{children}</h2>;
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
    defaultImage: p.defaultImage,
    albumImages: p.albumImages ?? [],
    sizeChartImage: p.sizeChartImage ?? '',
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
