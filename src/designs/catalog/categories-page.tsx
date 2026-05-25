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
  TableToolbar,
  Tabs,
  TabsList,
  TabsTrigger,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useGroups } from '@/features/catalog/groups/hooks/use-groups';
import {
  useCategories,
  useCreateCategory,
  useDeletedCategories,
  useHardDeleteCategory,
  useRestoreCategory,
  useSoftDeleteCategory,
  useUpdateCategory,
} from '@/features/catalog/categories/hooks/use-categories';
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/catalog/categories/schemas/category-form';
import type { ApiCategory, ApiGroup } from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { formatDate, formatGroupName } from '@/shared/utils/format';
import { idOf } from '@/shared/utils/relations';

type Tab = 'active' | 'deleted';

export function CategoriesPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [softDeleting, setSoftDeleting] = useState<ApiCategory | null>(null);
  const [hardDeleting, setHardDeleting] = useState<ApiCategory | null>(null);
  const [search, setSearch] = useState('');

  const activeQuery = useCategories();
  const deletedQuery = useDeletedCategories();
  const groupsQuery = useGroups();
  const softDelete = useSoftDeleteCategory();
  const restore = useRestoreCategory();
  const hardDelete = useHardDeleteCategory();

  const currentQuery = tab === 'active' ? activeQuery : deletedQuery;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = useMemo(() => {
    if (!normalizedSearch) return currentQuery.data;
    return currentQuery.data?.filter((c) =>
      `${c.name.en} ${c.name.ar}`.toLowerCase().includes(normalizedSearch)
    );
  }, [currentQuery.data, normalizedSearch]);
  const isFiltered = normalizedSearch.length > 0;

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    groupsQuery.data?.forEach((g) => map.set(g._id, formatGroupName(g.name)));
    return map;
  }, [groupsQuery.data]);

  const columns = useMemo<ColumnDef<ApiCategory>[]>(
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
        id: 'nameAr',
        header: 'Name (AR)',
        accessorFn: (c) => c.name.ar,
        cell: ({ row }) => (
          <span dir="rtl" className="font-body-ar text-muted-foreground">
            {row.original.name.ar}
          </span>
        ),
      },
      {
        id: 'group',
        header: 'Group',
        accessorFn: (c) => idOf(c.groupSize),
        cell: ({ row }) => {
          const gid = idOf(row.original.groupSize);
          return (
            <span className="text-muted-foreground">{groupNameById.get(gid) ?? '—'}</span>
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
    [tab, groupNameById, restore]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Categories drive the storefront's top-level navigation."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add category
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
          searchPlaceholder="Search categories by name…"
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
        onClearFilters={() => setSearch('')}
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
                {groupNameById.get(idOf(c.groupSize)) ?? '—'}
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
          title: tab === 'active' ? 'No categories yet' : 'Nothing in the trash',
          description:
            tab === 'active'
              ? 'Set up at least one size group before creating categories.'
              : 'Soft-deleted categories will appear here.',
          action:
            tab === 'active' ? (
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={14} strokeWidth={1.5} aria-hidden />
                Add category
              </Button>
            ) : undefined,
        }}
      />

      <CategoryFormSheet
        key={editing?._id ?? (creating ? 'create' : 'closed')}
        open={sheetOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        entity={editing}
        groups={groupsQuery.data ?? []}
      />

      <ConfirmDialog
        open={softDeleting !== null}
        onOpenChange={(o) => !o && setSoftDeleting(null)}
        title={`Remove "${softDeleting?.name.en}"?`}
        description="The category will be hidden from the storefront but can be restored from the Deleted tab."
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
        description="This removes the category from the database. Sub-categories and products referencing it may break."
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

interface CategoryFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiCategory | null;
  groups: ApiGroup[];
}

function CategoryFormSheet({ open, onClose, entity, groups }: CategoryFormSheetProps) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: CategoryFormValues = {
    name: entity?.name ?? emptyBilingual(),
    groupSize: entity ? idOf(entity.groupSize) : '',
    imageUrl: entity?.image?.mediaUrl ?? '',
  };
  const [values, setValues] = useState<CategoryFormValues>(initial);
  const [errors, setErrors] = useState<{
    name?: { en?: string; ar?: string };
    groupSize?: string;
    imageUrl?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = categoryFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0] === 'name') {
          if (!next.name) next.name = {};
          const lang = iss.path[1] as 'en' | 'ar';
          if (lang && !next.name[lang]) next.name[lang] = iss.message;
        } else if (iss.path[0] === 'groupSize' && !next.groupSize) {
          next.groupSize = iss.message;
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
      title={isEdit ? 'Edit category' : 'New category'}
      description={isEdit ? entity?.name.en : 'Bilingual name, one size group, one image.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={!values.imageUrl}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <BilingualInput
          label="Name"
          required
          value={values.name}
          onChange={(name) => setValues((p) => ({ ...p, name }))}
          error={errors.name}
          placeholder={{ en: 'Bras', ar: 'حمالة صدر' }}
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
            folder="Category"
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
