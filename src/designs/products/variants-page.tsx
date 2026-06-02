import { useMemo, useState } from 'react';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toLocalized } from '@/shared/utils/bilingual';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Input,
  NumberInput,
  NotFoundState,
  PageSkeleton,
  QueryErrorState,
  SearchableSelect,
  StickyActionBar,
  type StickyActionStatus,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import { useColors } from '@/features/catalog/colors/hooks/use-colors';
import { useProduct } from '@/features/products/hooks/use-products';
import {
  useBulkDeleteVariants,
  useBulkUpdateVariants,
  useCreateVariant,
  useDeleteVariant,
  useVariantsByProduct,
} from '@/features/products/hooks/use-variants';
import type { ApiColor, ApiVariant } from '@/shared/types/api';
import { isNotFoundError } from '@/shared/lib/api-error';

interface VariantsPageProps {
  productId: string;
}

interface DraftRow {
  _id: string;
  size: string;
  color: string;
  quantity: number;
  original: { size: string; color: string; quantity: number };
}

export function VariantsPage({ productId }: VariantsPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('products');
  const productQuery = useProduct(productId);
  const variantsQuery = useVariantsByProduct(productId);
  const loadError = productQuery.error ?? variantsQuery.error;

  if (productQuery.isPending || variantsQuery.isPending) return <PageSkeleton />;
  if (productQuery.isError || variantsQuery.isError) {
    if (isNotFoundError(loadError)) {
      return (
        <NotFoundState
          error={loadError}
          onBack={() => navigate({ to: ROUTES.products, search: { page: 1, search: '', tab: 'active', flags: [] } })}
          backLabel={t('form.header.backToProducts')}
        />
      );
    }
    return (
      <QueryErrorState
        error={loadError}
        onRetry={() => {
          productQuery.refetch();
          variantsQuery.refetch();
        }}
      />
    );
  }

  return (
    <VariantsInner
      productId={productId}
      productName={productQuery.data ? toLocalized(productQuery.data.name) : t('form.header.editTitle')}
      variants={variantsQuery.data ?? []}
    />
  );
}

function VariantsInner({
  productId,
  productName,
  variants,
}: {
  productId: string;
  productName: string;
  variants: ApiVariant[];
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('products');
  const colorsQuery = useColors();

  const [drafts, setDrafts] = useState<DraftRow[]>(() => variants.map(toDraft));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState<{ size: string; color: string; quantity: number | '' }>({
    size: '',
    color: '',
    quantity: 0,
  });
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const bulkUpdate = useBulkUpdateVariants(productId);
  const bulkDelete = useBulkDeleteVariants(productId);
  const createOne = useCreateVariant(productId);
  const deleteOne = useDeleteVariant(productId);

  const dirtyRows = useMemo(
    () =>
      drafts.filter(
        (d) =>
          d.size !== d.original.size ||
          d.color !== d.original.color ||
          d.quantity !== d.original.quantity
      ),
    [drafts]
  );

  useBlocker({
    shouldBlockFn: () => {
      if (dirtyRows.length === 0) return false;
      return !window.confirm(t('variants.leaveConfirm', { count: dirtyRows.length }));
    },
    enableBeforeUnload: () => dirtyRows.length > 0,
  });

  const setRow = (id: string, patch: Partial<DraftRow>) =>
    setDrafts((p) => p.map((d) => (d._id === id ? { ...d, ...patch } : d)));

  const toggleSelected = (id: string, checked: boolean) =>
    setSelected((p) => {
      const next = new Set(p);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(drafts.map((d) => d._id)) : new Set());

  const handleBulkSave = () => {
    if (dirtyRows.length === 0) return;
    bulkUpdate.mutate(
      dirtyRows.map((d) => ({
        _id: d._id,
        size: d.size,
        color: d.color || undefined,
        quantity: d.quantity,
      })),
      {
        onSuccess: () =>
          setDrafts((p) =>
            p.map((d) => ({
              ...d,
              original: { size: d.size, color: d.color, quantity: d.quantity },
            }))
          ),
      }
    );
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    bulkDelete.mutate(Array.from(selected), {
      onSuccess: () => {
        setDrafts((p) => p.filter((d) => !selected.has(d._id)));
        setSelected(new Set());
        setBulkDeleting(false);
      },
    });
  };

  const handleAdd = () => {
    const qty = typeof newRow.quantity === 'number' ? newRow.quantity : 0;
    const trimmedSize = newRow.size.trim();
    createOne.mutate(
      {
        productId,
        size: trimmedSize.length > 0 ? trimmedSize : 'one size',
        color: newRow.color || undefined,
        quantity: qty,
      },
      {
        onSuccess: (variant) => {
          setDrafts((p) => [...p, toDraft(variant)]);
          setNewRow({ size: '', color: '', quantity: 0 });
        },
      }
    );
  };

  const handleDeleteOne = (id: string) => {
    deleteOne.mutate(id, {
      onSuccess: () => {
        setDrafts((p) => p.filter((d) => d._id !== id));
        setSelected((p) => {
          const next = new Set(p);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const allChecked = drafts.length > 0 && drafts.every((d) => selected.has(d._id));
  const someChecked = !allChecked && drafts.some((d) => selected.has(d._id));

  const handleDiscard = () =>
    setDrafts((p) =>
      p.map((d) => ({ ...d, size: d.original.size, color: d.original.color, quantity: d.original.quantity }))
    );

  const stickyOpen = dirtyRows.length > 0 || selected.size > 0;
  const stickyStatus: StickyActionStatus = bulkUpdate.isPending
    ? 'saving'
    : dirtyRows.length > 0
      ? 'dirty'
      : 'idle';
  const stickyLabel =
    bulkUpdate.isPending
      ? t('variants.saving', { count: dirtyRows.length })
      : dirtyRows.length > 0
        ? t('variants.unsavedRows', { count: dirtyRows.length })
        : t('variants.selectedCount', { count: selected.size });

  return (
    <>
      <PageHeader
        title={t('variants.pageTitle', { name: productName })}
        breadcrumbLabel={t('variants.crumb', { name: productName })}
        subtitle={t('variants.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: ROUTES.products, search: { page: 1, search: '', tab: 'active', flags: [] } })}>
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
              {t('variants.back')}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: ROUTES.productDetail(productId) })}
            >
              {t('variants.editProduct')}
            </Button>
          </div>
        }
      />

      <Card padding="md" className="overflow-hidden">
        <div className="space-y-3 md:hidden">
          {drafts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t('variants.emptyNote')}
            </p>
          ) : (
            drafts.map((d) => {
              const isDirty =
                d.size !== d.original.size ||
                d.color !== d.original.color ||
                d.quantity !== d.original.quantity;
              return (
                <div
                  key={d._id}
                  className={`rounded-xl border p-3 transition-colors ${
                    isDirty
                      ? 'border-accent/40 bg-accent-soft/30 shadow-[inset_3px_0_0_0_var(--color-accent)]'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Checkbox
                      checked={selected.has(d._id)}
                      onCheckedChange={(c) => toggleSelected(d._id, Boolean(c))}
                      aria-label={t('variants.selectVariant')}
                    />
                    <div className="flex items-center gap-2">
                      {isDirty ? (
                        <span
                          className="inline-flex items-center gap-1 text-eyebrow text-accent"
                          aria-label={t('variants.unsavedAria')}
                        >
                          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                          {t('variants.unsaved')}
                        </span>
                      ) : bulkUpdate.isPending && bulkUpdate.variables?.some((v) => v._id === d._id) ? (
                        <Loader2 size={14} className="animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <Check size={14} className="text-success" aria-hidden />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOne(d._id)}
                        aria-label={t('variants.deleteVariant')}
                        disabled={deleteOne.isPending && deleteOne.variables === d._id}
                      >
                        <Trash2 size={14} strokeWidth={1.5} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-eyebrow text-muted-foreground">{t('variants.columns.size')}</span>
                      <Input
                        value={d.size}
                        onChange={(e) => setRow(d._id, { size: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-eyebrow text-muted-foreground">{t('variants.columns.qtyShort')}</span>
                      <NumberInput
                        value={d.quantity}
                        onChange={(v) => setRow(d._id, { quantity: typeof v === 'number' ? v : 0 })}
                        clampMin={0}
                      />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1">
                      <span className="text-eyebrow text-muted-foreground">{t('variants.columns.color')}</span>
                      <SearchableSelect<ApiColor>
                        value={d.color || undefined}
                        onChange={(v) => setRow(d._id, { color: v ?? '' })}
                        items={colorsQuery.data ?? []}
                        getKey={(c) => c._id}
                        getLabel={(c) => toLocalized(c.name)}
                        renderItem={(c) => (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                              style={{ backgroundColor: c.hex }}
                              aria-hidden
                            />
                            {toLocalized(c.name)}
                          </span>
                        )}
                        placeholder={t('variants.colorPlaceholder')}
                        clearable={!d.original.color}
                      />
                    </label>
                  </div>
                </div>
              );
            })
          )}

          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <p className="mb-2 text-eyebrow text-muted-foreground">
              {t('variants.addPanelTitle')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newRow.size}
                onChange={(e) => setNewRow((p) => ({ ...p, size: e.target.value }))}
                placeholder={t('variants.newSizePlaceholderMobile')}
                aria-label={t('variants.newSizeAria')}
              />
              <NumberInput
                value={newRow.quantity}
                onChange={(v) => setNewRow((p) => ({ ...p, quantity: v }))}
                clampMin={0}
              />
              <div className="col-span-2">
                <SearchableSelect<ApiColor>
                  value={newRow.color || undefined}
                  onChange={(v) => setNewRow((p) => ({ ...p, color: v ?? '' }))}
                  items={colorsQuery.data ?? []}
                  getKey={(c) => c._id}
                  getLabel={(c) => toLocalized(c.name)}
                  placeholder={t('variants.colorPlaceholder')}
                />
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                isLoading={createOne.isPending}
                disabled={!newRow.size.trim()}
                className="col-span-2"
              >
                <Plus size={14} strokeWidth={1.5} aria-hidden />
                {t('variants.addVariantBtn')}
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th scope="col" className="w-10 px-4 py-3 text-start">
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                    aria-label={t('variants.selectAll')}
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-start text-eyebrow text-muted-foreground">
                  {t('variants.columns.size')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-eyebrow text-muted-foreground">
                  {t('variants.columns.color')}
                </th>
                <th scope="col" className="px-4 py-3 text-start text-eyebrow text-muted-foreground">
                  {t('variants.columns.qty')}
                </th>
                <th scope="col" className="w-12 px-4 py-3 text-end text-eyebrow text-muted-foreground">
                  {t('variants.columns.status')}
                </th>
                <th scope="col" className="w-12 px-4 py-3 text-end" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('variants.emptyNote')}
                  </td>
                </tr>
              ) : (
                drafts.map((d) => {
                  const isDirty =
                    d.size !== d.original.size ||
                    d.color !== d.original.color ||
                    d.quantity !== d.original.quantity;
                  return (
                    <tr
                      key={d._id}
                      className={`group/row transition-shadow hover:bg-muted/30 ${isDirty ? 'bg-accent-soft/30 shadow-[inset_3px_0_0_0_var(--color-accent)]' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(d._id)}
                          onCheckedChange={(c) => toggleSelected(d._id, Boolean(c))}
                          aria-label={t('variants.selectVariant')}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={d.size}
                          onChange={(e) => setRow(d._id, { size: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <SearchableSelect<ApiColor>
                          value={d.color || undefined}
                          onChange={(v) => setRow(d._id, { color: v ?? '' })}
                          items={colorsQuery.data ?? []}
                          getKey={(c) => c._id}
                          getLabel={(c) => toLocalized(c.name)}
                          renderItem={(c) => (
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                                style={{ backgroundColor: c.hex }}
                                aria-hidden
                              />
                              {toLocalized(c.name)}
                            </span>
                          )}
                          placeholder={t('variants.colorPlaceholder')}
                          clearable={!d.original.color}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <NumberInput
                          value={d.quantity}
                          onChange={(v) =>
                            setRow(d._id, { quantity: typeof v === 'number' ? v : 0 })
                          }
                          clampMin={0}
                        />
                      </td>
                      <td className="px-4 py-3 text-end">
                        {isDirty ? (
                          <span
                            className="ms-auto inline-flex h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-accent/20"
                            role="status"
                            aria-label={t('variants.unsavedChanges')}
                          />
                        ) : bulkUpdate.isPending && bulkUpdate.variables?.some((v) => v._id === d._id) ? (
                          <Loader2 size={14} className="ms-auto animate-spin text-muted-foreground" aria-hidden />
                        ) : (
                          <Check size={14} className="ms-auto text-success" aria-hidden />
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOne(d._id)}
                          aria-label={t('variants.deleteVariant')}
                          disabled={deleteOne.isPending && deleteOne.variables === d._id}
                        >
                          <Trash2 size={14} strokeWidth={1.5} className="text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}

              <tr className="bg-muted/30">
                <td className="px-4 py-3" />
                <td className="px-4 py-3">
                  <Input
                    value={newRow.size}
                    onChange={(e) => setNewRow((p) => ({ ...p, size: e.target.value }))}
                    placeholder={t('variants.newSizePlaceholderDesktop')}
                    aria-label={t('variants.newSizeAria')}
                  />
                </td>
                <td className="px-4 py-3">
                  <SearchableSelect<ApiColor>
                    value={newRow.color || undefined}
                    onChange={(v) => setNewRow((p) => ({ ...p, color: v ?? '' }))}
                    items={colorsQuery.data ?? []}
                    getKey={(c) => c._id}
                    getLabel={(c) => toLocalized(c.name)}
                    placeholder={t('variants.colorPlaceholder')}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberInput
                    value={newRow.quantity}
                    onChange={(v) => setNewRow((p) => ({ ...p, quantity: v }))}
                    clampMin={0}
                  />
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-end">
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    isLoading={createOne.isPending}
                  >
                    <Plus size={14} strokeWidth={1.5} aria-hidden />
                    {t('variants.addBtn')}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reserve clearance so the table never sits under the sticky action bar */}
      <div aria-hidden className="h-24" />

      <StickyActionBar
        open={stickyOpen}
        status={stickyStatus}
        statusLabel={stickyLabel}
        destructive={
          selected.size > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleting(true)}
              isLoading={bulkDelete.isPending}
              loadingText={t('variants.deletingCount', { count: selected.size })}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden />
              {t('variants.deleteSelected', { count: selected.size })}
            </Button>
          ) : null
        }
        secondary={
          dirtyRows.length > 0 ? (
            <Button variant="ghost" onClick={handleDiscard} disabled={bulkUpdate.isPending}>
              {t('variants.discard')}
            </Button>
          ) : null
        }
        primary={
          dirtyRows.length > 0 ? (
            <Button
              onClick={handleBulkSave}
              isLoading={bulkUpdate.isPending}
              loadingText={t('variants.savingCount', { count: dirtyRows.length })}
            >
              <Save size={14} strokeWidth={1.5} aria-hidden />
              {t('variants.saveChanges', { count: dirtyRows.length })}
            </Button>
          ) : null
        }
      />

      <ConfirmDialog
        open={bulkDeleting}
        onOpenChange={setBulkDeleting}
        title={t('variants.confirm.bulkDelete.title', { count: selected.size })}
        description={t('variants.confirm.bulkDelete.description')}
        variant="destructive"
        confirmLabel={t('variants.confirm.bulkDelete.confirmLabel')}
        isPending={bulkDelete.isPending}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}

function toDraft(v: ApiVariant): DraftRow {
  const colorId = !v.color ? '' : typeof v.color === 'string' ? v.color : v.color._id;
  return {
    _id: v._id,
    size: v.size,
    color: colorId,
    quantity: v.quantity,
    original: { size: v.size, color: colorId, quantity: v.quantity },
  };
}
