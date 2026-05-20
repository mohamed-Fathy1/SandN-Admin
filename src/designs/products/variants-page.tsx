import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Input,
  NumberInput,
  PageSkeleton,
  QueryErrorState,
  SearchableSelect,
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
  const productQuery = useProduct(productId);
  const variantsQuery = useVariantsByProduct(productId);

  if (productQuery.isPending || variantsQuery.isPending) return <PageSkeleton />;
  if (productQuery.isError || variantsQuery.isError) {
    return (
      <QueryErrorState
        error={productQuery.error ?? variantsQuery.error}
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
      productName={productQuery.data?.name.en ?? 'Product'}
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
        color: d.color,
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
    if (!newRow.size.trim() || !newRow.color) return;
    const qty = typeof newRow.quantity === 'number' ? newRow.quantity : 0;
    createOne.mutate(
      { productId, size: newRow.size.trim(), color: newRow.color, quantity: qty },
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

  return (
    <>
      <PageHeader
        title={`${productName} — Variants`}
        subtitle="Inline-edit stock, sizes, and colors. Save dirty rows in one shot."
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: ROUTES.products, search: { page: 1, search: '' } })}>
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: ROUTES.productDetail(productId) })}
            >
              Edit product
            </Button>
            <Button
              variant="destructive"
              onClick={() => setBulkDeleting(true)}
              disabled={selected.size === 0 || bulkDelete.isPending}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden />
              Delete selected ({selected.size})
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={dirtyRows.length === 0 || bulkUpdate.isPending}
              isLoading={bulkUpdate.isPending}
            >
              <Save size={14} strokeWidth={1.5} aria-hidden />
              Save {dirtyRows.length > 0 ? `(${dirtyRows.length})` : ''}
            </Button>
          </div>
        }
      />

      <Card padding="md" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th scope="col" className="w-10 px-4 py-3 text-left">
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                    aria-label="Select all variants"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Size
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Color
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Quantity
                </th>
                <th scope="col" className="w-12 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th scope="col" className="w-12 px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No variants yet. Add the first one below.
                  </td>
                </tr>
              ) : (
                drafts.map((d) => {
                  const isDirty =
                    d.size !== d.original.size ||
                    d.color !== d.original.color ||
                    d.quantity !== d.original.quantity;
                  return (
                    <tr key={d._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(d._id)}
                          onCheckedChange={(c) => toggleSelected(d._id, Boolean(c))}
                          aria-label="Select variant"
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
                          clearable={false}
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
                      <td className="px-4 py-3 text-right">
                        {isDirty ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-label="Unsaved" />
                        ) : bulkUpdate.isPending && bulkUpdate.variables?.some((v) => v._id === d._id) ? (
                          <Loader2 size={14} className="ml-auto animate-spin text-muted-foreground" aria-hidden />
                        ) : (
                          <Check size={14} className="ml-auto text-success" aria-hidden />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOne(d._id)}
                          aria-label="Delete variant"
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
                    placeholder="Size (e.g. m)"
                    aria-label="New variant size"
                  />
                </td>
                <td className="px-4 py-3">
                  <SearchableSelect<ApiColor>
                    value={newRow.color || undefined}
                    onChange={(v) => setNewRow((p) => ({ ...p, color: v ?? '' }))}
                    items={colorsQuery.data ?? []}
                    getKey={(c) => c._id}
                    getLabel={(c) => c.name.en}
                    placeholder="Color"
                    clearable={false}
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
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    isLoading={createOne.isPending}
                    disabled={!newRow.size.trim() || !newRow.color}
                  >
                    <Plus size={14} strokeWidth={1.5} aria-hidden />
                    Add
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={bulkDeleting}
        onOpenChange={setBulkDeleting}
        title={`Delete ${selected.size} variant(s)?`}
        description="The selected variants will be removed. Orders that reference them will keep historical pricing but won't be re-orderable."
        variant="destructive"
        confirmLabel="Delete"
        isPending={bulkDelete.isPending}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}

function toDraft(v: ApiVariant): DraftRow {
  const colorId = typeof v.color === 'string' ? v.color : v.color._id;
  return {
    _id: v._id,
    size: v.size,
    color: colorId,
    quantity: v.quantity,
    original: { size: v.size, color: colorId, quantity: v.quantity },
  };
}
