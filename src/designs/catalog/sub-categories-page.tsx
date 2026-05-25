import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  AdminFormField,
  AdminImageUploader,
  AdminTable,
  BilingualInput,
  Button,
  ConfirmDialog,
  FormSheet,
  SearchableSelect,
  Select,
  TableToolbar,
  Tabs,
  TabsList,
  TabsTrigger,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useCategories } from '@/features/catalog/categories/hooks/use-categories';
import { useGroups } from '@/features/catalog/groups/hooks/use-groups';
import {
  useCreateSubCategory,
  useDeletedSubCategories,
  useHardDeleteSubCategory,
  useRestoreSubCategory,
  useSoftDeleteSubCategory,
  useSubCategories,
  useUpdateSubCategory,
} from '@/features/catalog/sub-categories/hooks/use-sub-categories';
import {
  subCategoryFormSchema,
  type SubCategoryFormValues,
} from '@/features/catalog/sub-categories/schemas/sub-category-form';
import type { ApiCategory, ApiGroup, ApiSubCategory } from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { formatDate, formatGroupName } from '@/shared/utils/format';
import { idOf } from '@/shared/utils/relations';

type Tab = 'active' | 'deleted';

export function SubCategoriesPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiSubCategory | null>(null);
  const [softDeleting, setSoftDeleting] = useState<ApiSubCategory | null>(null);
  const [hardDeleting, setHardDeleting] = useState<ApiSubCategory | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const activeQuery = useSubCategories();
  const deletedQuery = useDeletedSubCategories();
  const categoriesQuery = useCategories();
  const groupsQuery = useGroups();
  const softDelete = useSoftDeleteSubCategory();
  const restore = useRestoreSubCategory();
  const hardDelete = useHardDeleteSubCategory();

  const currentQuery = tab === 'active' ? activeQuery : deletedQuery;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = useMemo(() => {
    let rows = currentQuery.data;
    if (!rows) return rows;
    if (normalizedSearch) {
      rows = rows.filter((c) =>
        `${c.name.en} ${c.name.ar}`.toLowerCase().includes(normalizedSearch)
      );
    }
    if (categoryFilter) {
      rows = rows.filter((c) => idOf(c.category) === categoryFilter);
    }
    return rows;
  }, [currentQuery.data, normalizedSearch, categoryFilter]);
  const isFiltered = normalizedSearch.length > 0 || Boolean(categoryFilter);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoriesQuery.data?.forEach((c) => map.set(c._id, c.name.en));
    return map;
  }, [categoriesQuery.data]);

  const columns = useMemo<ColumnDef<ApiSubCategory>[]>(
    () => [
      {
        id: 'image',
        header: '',
        enableSorting: false,
        size: 60,
        cell: ({ row }) => <Thumbnail src={row.original.image?.mediaUrl} size="sm" />,
      },
      {
        id: 'nameEn',
        header: 'Name (EN)',
        accessorFn: (c) => c.name.en,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name.en}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (c) => idOf(c.category),
        cell: ({ row }) => {
          const cid = idOf(row.original.category);
          return (
            <span className="text-muted-foreground">{categoryNameById.get(cid) ?? '—'}</span>
          );
        },
      },
      {
        id: 'created',
        header: 'Created',
        accessorFn: (c) => c.createdAt ?? '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          tab === 'active' ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(row.original);
                }}
              >
                <Pencil size={14} strokeWidth={1.5} aria-hidden />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoftDeleting(row.original);
                }}
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  restore.mutate(row.original._id);
                }}
                isLoading={restore.isPending && restore.variables === row.original._id}
              >
                <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setHardDeleting(row.original);
                }}
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          ),
      },
    ],
    [tab, categoryNameById, restore]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title="Sub-categories"
        subtitle="Sub-categories belong to a parent category and refine browsing."
        action={
          <Button onClick={() => setCreating(true)} disabled={!categoriesQuery.data?.length}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add sub-category
          </Button>
        }
        tabs={
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="deleted">Deleted</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search sub-categories by name…"
          filters={
            categoriesQuery.data && categoriesQuery.data.length > 0 ? (
              <Select
                value={categoryFilter || '__all'}
                onValueChange={(v) => setCategoryFilter(v === '__all' ? '' : v)}
                placeholder="All categories"
                options={[
                  { value: '__all', label: 'All categories' },
                  ...categoriesQuery.data.map((c) => ({ value: c._id, label: c.name.en })),
                ]}
                aria-label="Filter by parent category"
                className="min-w-[180px]"
              />
            ) : null
          }
          meta={
            currentQuery.data
              ? `${filteredData?.length ?? 0} of ${currentQuery.data.length}`
              : undefined
          }
        />
      </div>

      <AdminTable
        data={filteredData}
        columns={columns}
        isLoading={currentQuery.isPending}
        isError={currentQuery.isError}
        error={currentQuery.error}
        onRetry={() => currentQuery.refetch()}
        getRowId={(c) => c._id}
        isFiltered={isFiltered}
        onClearFilters={() => {
          setSearch('');
          setCategoryFilter('');
        }}
        mobileRender={(c) => (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Thumbnail src={c.image?.mediaUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{c.name.en}</p>
              <p
                dir="rtl"
                className="truncate font-body-ar text-xs text-muted-foreground"
              >
                {c.name.ar}
              </p>
              <p className="mt-0.5 text-[11px] text-light-foreground">
                {categoryNameById.get(idOf(c.category)) ?? '—'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {tab === 'active' ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                    }}
                  >
                    <Pencil size={14} strokeWidth={1.5} aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSoftDeleting(c);
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    restore.mutate(c._id);
                  }}
                  isLoading={restore.isPending && restore.variables === c._id}
                >
                  <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                </Button>
              )}
            </div>
          </div>
        )}
        emptyState={{
          title: tab === 'active' ? 'No sub-categories yet' : 'Nothing in the trash',
          description:
            tab === 'active'
              ? 'Create a parent category first, then add sub-categories underneath.'
              : 'Soft-deleted sub-categories will appear here.',
          action:
            tab === 'active' && categoriesQuery.data?.length ? (
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={14} strokeWidth={1.5} aria-hidden />
                Add sub-category
              </Button>
            ) : undefined,
        }}
      />

      <SubCategoryFormSheet
        key={editing?._id ?? (creating ? 'create' : 'closed')}
        open={sheetOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        entity={editing}
        categories={categoriesQuery.data ?? []}
        groups={groupsQuery.data ?? []}
      />

      <ConfirmDialog
        open={softDeleting !== null}
        onOpenChange={(o) => !o && setSoftDeleting(null)}
        title={`Remove "${softDeleting?.name.en}"?`}
        description="The sub-category will be hidden but can be restored from the Deleted tab."
        variant="warning"
        confirmLabel="Remove"
        isPending={softDelete.isPending}
        onConfirm={() => {
          if (!softDeleting) return;
          softDelete.mutate(softDeleting._id, { onSuccess: () => setSoftDeleting(null) });
        }}
      />

      <ConfirmDialog
        open={hardDeleting !== null}
        onOpenChange={(o) => !o && setHardDeleting(null)}
        title={`Permanently delete "${hardDeleting?.name.en}"?`}
        description="This removes the sub-category from the database. Any products referencing it may break."
        confirmLabel="Delete permanently"
        requireTypedConfirmation="delete"
        isPending={hardDelete.isPending}
        onConfirm={() => {
          if (!hardDeleting) return;
          hardDelete.mutate(hardDeleting._id, { onSuccess: () => setHardDeleting(null) });
        }}
      />
    </>
  );
}

interface SubCategoryFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiSubCategory | null;
  categories: ApiCategory[];
  groups: ApiGroup[];
}

function SubCategoryFormSheet({
  open,
  onClose,
  entity,
  categories,
  groups,
}: SubCategoryFormSheetProps) {
  const create = useCreateSubCategory();
  const update = useUpdateSubCategory();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: SubCategoryFormValues = {
    name: entity?.name ?? emptyBilingual(),
    groupSize: entity ? idOf(entity.groupSize) : '',
    category: entity ? idOf(entity.category) : '',
    imageUrl: entity?.image?.mediaUrl ?? '',
  };
  const [values, setValues] = useState<SubCategoryFormValues>(initial);
  const [errors, setErrors] = useState<{
    name?: { en?: string; ar?: string };
    groupSize?: string;
    category?: string;
    imageUrl?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = subCategoryFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0] === 'name') {
          if (!next.name) next.name = {};
          const lang = iss.path[1] as 'en' | 'ar';
          if (lang && !next.name[lang]) next.name[lang] = iss.message;
        } else if (iss.path[0] === 'groupSize' && !next.groupSize) {
          next.groupSize = iss.message;
        } else if (iss.path[0] === 'category' && !next.category) {
          next.category = iss.message;
        } else if (iss.path[0] === 'imageUrl' && !next.imageUrl) {
          next.imageUrl = iss.message;
        }
      });
      setErrors(next);
      return;
    }
    if (isEdit && entity) {
      update.mutate({ id: entity._id, payload: parsed.data }, { onSuccess: onClose });
    } else {
      create.mutate(parsed.data, { onSuccess: onClose });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={isEdit ? 'Edit sub-category' : 'New sub-category'}
      description={isEdit ? entity?.name.en : 'Pick a parent category, then add localized names.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={!values.imageUrl}>
            {isEdit ? 'Save changes' : 'Create sub-category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormField label="Parent category" required error={errors.category}>
          <SearchableSelect<ApiCategory>
            value={values.category || undefined}
            onChange={(v) => setValues((p) => ({ ...p, category: v ?? '' }))}
            items={categories}
            getKey={(c) => c._id}
            getLabel={(c) => c.name.en}
            getSearchText={(c) => `${c.name.en} ${c.name.ar}`}
            placeholder="Pick a category"
            disabled={isPending}
            clearable={false}
          />
        </AdminFormField>

        <BilingualInput
          label="Name"
          required
          value={values.name}
          onChange={(name) => setValues((p) => ({ ...p, name }))}
          error={errors.name}
          placeholder={{ en: 'Sportswear', ar: 'ملابس رياضية' }}
        />

        <AdminFormField label="Size group" required error={errors.groupSize}>
          <SearchableSelect<ApiGroup>
            value={values.groupSize || undefined}
            onChange={(v) => setValues((p) => ({ ...p, groupSize: v ?? '' }))}
            items={groups}
            getKey={(g) => g._id}
            getLabel={(g) => formatGroupName(g.name)}
            placeholder="Pick a size group"
            disabled={isPending}
            clearable={false}
          />
        </AdminFormField>

        <AdminFormField label="Cover image" required error={errors.imageUrl}>
          <AdminImageUploader
            folder="SubCategory"
            value={values.imageUrl || undefined}
            onChange={(imageUrl) => setValues((p) => ({ ...p, imageUrl }))}
            onClear={() => setValues((p) => ({ ...p, imageUrl: '' }))}
            disabled={isPending}
            hasError={Boolean(errors.imageUrl)}
            aspectRatio="3 / 2"
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
