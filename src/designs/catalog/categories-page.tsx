import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AdminFormField,
  AdminImageUploader,
  AdminTable,
  BilingualInput,
  Button,
  ConfirmDialog,
  FormSheet,
  IconPicker,
  NumberInput,
  SearchableSelect,
  TableToolbar,
  Tabs,
  TabsList,
  TabsTrigger,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useGroups } from '@/features/catalog/groups/hooks/use-groups';
import { useIcons } from '@/features/catalog/icons/hooks/use-icons';
import {
  useCategories,
  useCreateCategory,
  useDeletedCategories,
  useHardDeleteCategory,
  useReorderCategories,
  useRestoreCategory,
  useSoftDeleteCategory,
  useUpdateCategory,
} from '@/features/catalog/categories/hooks/use-categories';
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/catalog/categories/schemas/category-form';
import type { ApiCategory, ApiCategoryIcon, ApiGroup } from '@/shared/types/api';
import { emptyBilingual, toLocalized } from '@/shared/utils/bilingual';
import { formatDate, formatGroupName } from '@/shared/utils/format';
import { mapApiErrorsToFields } from '@/shared/utils/forms';
import { idOf } from '@/shared/utils/relations';
import { SortableCategoryList } from './sortable-category-list';

type Tab = 'active' | 'deleted';

export function CategoriesPage() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const [tab, setTab] = useState<Tab>('active');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [softDeleting, setSoftDeleting] = useState<ApiCategory | null>(null);
  const [hardDeleting, setHardDeleting] = useState<ApiCategory | null>(null);
  const [search, setSearch] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderedItems, setReorderedItems] = useState<ApiCategory[]>([]);

  const activeQuery = useCategories();
  const deletedQuery = useDeletedCategories();
  const groupsQuery = useGroups();
  const iconsQuery = useIcons();
  const softDelete = useSoftDeleteCategory();
  const restore = useRestoreCategory();
  const hardDelete = useHardDeleteCategory();
  const reorder = useReorderCategories();

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
        id: 'icon',
        header: t('categories.columns.icon'),
        enableSorting: false,
        size: 60,
        cell: ({ row }) => {
          const svg = row.original.icon?.svg;
          if (!svg) {
            return <span className="text-xs text-light-foreground">—</span>;
          }
          return (
            <span
              aria-hidden
              title={row.original.icon?.key}
              className="inline-flex h-6 w-6 items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          );
        },
      },
      {
        id: 'name',
        header: t('categories.columns.name'),
        accessorFn: (c) => c.name.en,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{toLocalized(row.original.name)}</p>
            <p
              dir="rtl"
              className="mt-0.5 truncate font-body-ar text-xs text-muted-foreground"
              title={row.original.name.ar}
            >
              {row.original.name.ar}
            </p>
          </div>
        ),
      },
      {
        id: 'group',
        header: t('categories.columns.group'),
        accessorFn: (c) => idOf(c.groupSize),
        cell: ({ row }) => {
          const gid = idOf(row.original.groupSize);
          return (
            <span className="text-muted-foreground">{groupNameById.get(gid) ?? '—'}</span>
          );
        },
      },
      {
        id: 'order',
        header: t('categories.columns.order'),
        accessorKey: 'order',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.original.order}</span>
        ),
      },
      {
        id: 'created',
        header: t('categories.columns.created'),
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
                {tCommon('actions.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoftDeleting(row.original);
                }}
                aria-label={t('categories.aria.hide', { name: toLocalized(row.original.name) })}
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
                {tCommon('actions.restore')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setHardDeleting(row.original);
                }}
                aria-label={t('categories.aria.permDelete', { name: toLocalized(row.original.name) })}
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          ),
      },
    ],
    [tab, groupNameById, restore, t, tCommon]
  );

  const sheetOpen = creating || editing !== null;

  const enterReorder = () => {
    setReorderedItems(activeQuery.data ?? []);
    setReorderMode(true);
  };
  const exitReorder = () => {
    setReorderMode(false);
    setReorderedItems([]);
  };

  const reorderDiff = useMemo(() => {
    if (!reorderMode) return [];
    return reorderedItems
      .map((c, i) => ({ category: c, newOrder: i }))
      .filter(({ category, newOrder }) => category.order !== newOrder);
  }, [reorderMode, reorderedItems]);

  const saveReorder = () => {
    if (reorderDiff.length === 0) return;
    const updates = reorderDiff.map(({ category, newOrder }) => ({
      id: category._id,
      payload: {
        name: category.name,
        groupSize: idOf(category.groupSize),
        iconId: category.iconId ?? category.icon?._id ?? '',
        imageUrl: category.image?.mediaUrl ?? '',
        order: newOrder,
      },
    }));
    reorder.mutate(updates, { onSuccess: exitReorder });
  };

  return (
    <>
      <PageHeader
        title={t('categories.title')}
        subtitle={reorderMode ? t('categories.reorder.subtitle') : t('categories.subtitle')}
        action={
          reorderMode ? (
            <Button variant="ghost" onClick={exitReorder} disabled={reorder.isPending}>
              <X size={16} strokeWidth={1.5} aria-hidden />
              {t('categories.reorder.cancel')}
            </Button>
          ) : (
            <div className="flex gap-2">
              {tab === 'active' && (activeQuery.data?.length ?? 0) > 1 ? (
                <Button variant="ghost" onClick={enterReorder}>
                  <ArrowUpDown size={16} strokeWidth={1.5} aria-hidden />
                  {t('categories.reorder.enter')}
                </Button>
              ) : null}
              <Button onClick={() => setCreating(true)}>
                <Plus size={16} strokeWidth={1.5} aria-hidden />
                {t('categories.addCategory')}
              </Button>
            </div>
          )
        }
        tabs={
          reorderMode ? undefined : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="active">{t('categories.tabs.active')}</TabsTrigger>
                <TabsTrigger value="deleted">{t('categories.tabs.deleted')}</TabsTrigger>
              </TabsList>
            </Tabs>
          )
        }
      />

      {reorderMode ? (
        <ReorderPanel
          items={reorderedItems}
          onReorder={setReorderedItems}
          groups={groupsQuery.data ?? []}
          dirtyCount={reorderDiff.length}
          onSave={saveReorder}
          isSaving={reorder.isPending}
        />
      ) : (
        <>
          <div className="mb-4">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('categories.searchPlaceholder')}
              meta={
                currentQuery.data
                  ? t('categories.meta', { count: filteredData?.length ?? 0, total: currentQuery.data.length })
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
              <p className="truncate font-medium text-foreground">{toLocalized(c.name)}</p>
              <p
                dir="rtl"
                className="truncate font-body-ar text-xs text-muted-foreground"
              >
                {c.name.ar}
              </p>
              <p className="mt-0.5 text-xs text-light-foreground">
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
                    aria-label={t('categories.aria.edit', { name: toLocalized(c.name) })}
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
                    aria-label={t('categories.aria.hide', { name: toLocalized(c.name) })}
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
          title: tab === 'active' ? t('categories.empty.noCategories') : t('categories.empty.trashTitle'),
          description:
            tab === 'active'
              ? t('categories.empty.intro')
              : t('categories.empty.trash'),
          action:
            tab === 'active' ? (
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={14} strokeWidth={1.5} aria-hidden />
                {t('categories.addCategory')}
              </Button>
            ) : undefined,
        }}
      />
        </>
      )}

      <CategoryFormSheet
        key={editing?._id ?? (creating ? 'create' : 'closed')}
        open={sheetOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        entity={editing}
        categories={activeQuery.data ?? []}
        groups={groupsQuery.data ?? []}
        icons={iconsQuery.data ?? []}
        iconsLoading={iconsQuery.isPending}
        iconsError={iconsQuery.isError}
      />

      <ConfirmDialog
        open={softDeleting !== null}
        onOpenChange={(o) => !o && setSoftDeleting(null)}
        title={t('categories.confirm.soft.title', { name: softDeleting ? toLocalized(softDeleting.name) : '' })}
        description={t('categories.confirm.soft.description')}
        variant="warning"
        confirmLabel={t('categories.confirm.soft.confirmLabel')}
        isPending={softDelete.isPending}
        onConfirm={() => {
          if (!softDeleting) return;
          softDelete.mutate(softDeleting._id, { onSuccess: () => setSoftDeleting(null) });
        }}
      />

      <ConfirmDialog
        open={hardDeleting !== null}
        onOpenChange={(o) => !o && setHardDeleting(null)}
        title={t('categories.confirm.hard.title', { name: hardDeleting ? toLocalized(hardDeleting.name) : '' })}
        description={t('categories.confirm.hard.description')}
        confirmLabel={t('categories.confirm.hard.confirmLabel')}
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
  categories: ApiCategory[];
  groups: ApiGroup[];
  icons: ApiCategoryIcon[];
  iconsLoading?: boolean;
  iconsError?: boolean;
}

function CategoryFormSheet({
  open,
  onClose,
  entity,
  categories,
  groups,
  icons,
  iconsLoading,
  iconsError,
}: CategoryFormSheetProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  // Spec: populated `icon` may not include `_id`. Prefer the document field,
  // fall back to looking up the icon in our local list by `icon.key`.
  const seedIconId =
    entity?.iconId
    ?? entity?.icon?._id
    ?? (entity?.icon?.key
      ? (icons.find((i) => i.key === entity.icon?.key)?._id ?? '')
      : '');
  // On create, append to the end of the list. On edit, keep the existing slot.
  const nextOrder =
    categories.length === 0 ? 0 : Math.max(...categories.map((c) => c.order)) + 1;
  const initial: CategoryFormValues = {
    name: entity?.name ?? emptyBilingual(),
    groupSize: entity ? idOf(entity.groupSize) : '',
    iconId: seedIconId,
    imageUrl: entity?.image?.mediaUrl ?? '',
    order: entity?.order ?? nextOrder,
  };
  const [values, setValues] = useState<CategoryFormValues>(initial);
  const [errors, setErrors] = useState<{
    name?: { en?: string; ar?: string };
    groupSize?: string;
    iconId?: string;
    imageUrl?: string;
    order?: string;
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
        } else if (iss.path[0] === 'iconId' && !next.iconId) {
          next.iconId = iss.message;
        } else if (iss.path[0] === 'imageUrl' && !next.imageUrl) {
          next.imageUrl = iss.message;
        } else if (iss.path[0] === 'order' && !next.order) {
          next.order = iss.message;
        }
      });
      setErrors(next);
      return;
    }
    const onError = (err: unknown) => {
      const fieldMap = mapApiErrorsToFields(err);
      if (!fieldMap) return;
      const next: typeof errors = {};
      for (const [path, msg] of Object.entries(fieldMap)) {
        const [head, leaf] = path.split('.');
        if (head === 'name' && (leaf === 'en' || leaf === 'ar')) {
          next.name = { ...(next.name ?? {}), [leaf]: msg };
        } else if (head === 'groupSize') {
          next.groupSize = msg;
        } else if (head === 'iconId') {
          next.iconId = msg;
        } else if (head === 'imageUrl') {
          next.imageUrl = msg;
        } else if (head === 'order') {
          next.order = msg;
        }
      }
      setErrors(next);
    };
    if (isEdit && entity) {
      update.mutate(
        { id: entity._id, payload: parsed.data },
        { onSuccess: onClose, onError }
      );
    } else {
      create.mutate(parsed.data, { onSuccess: onClose, onError });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={isEdit ? t('categories.edit') : t('categories.new')}
      description={isEdit && entity ? toLocalized(entity.name) : t('categories.form.newDescription')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={!values.imageUrl}>
            {isEdit ? tCommon('actions.saveChanges') : t('categories.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <BilingualInput
          label={t('categories.form.name')}
          required
          value={values.name}
          onChange={(name) => setValues((p) => ({ ...p, name }))}
          error={errors.name}
          placeholder={{ en: t('categories.form.namePlaceholderEn'), ar: t('categories.form.namePlaceholderAr') }}
        />

        <AdminFormField label={t('categories.form.sizeGroup')} required error={errors.groupSize}>
          <SearchableSelect<ApiGroup>
            value={values.groupSize || undefined}
            onChange={(v) => setValues((p) => ({ ...p, groupSize: v ?? '' }))}
            items={groups}
            getKey={(g) => g._id}
            getLabel={(g) => formatGroupName(g.name)}
            placeholder={t('categories.form.pickSizeGroup')}
            disabled={isPending}
            clearable={false}
          />
        </AdminFormField>

        <AdminFormField
          label={t('categories.form.icon')}
          required
          error={errors.iconId}
          hint={t('categories.form.iconHint')}
        >
          <IconPicker
            icons={icons}
            value={values.iconId || undefined}
            onChange={(iconId) => setValues((p) => ({ ...p, iconId }))}
            isLoading={iconsLoading}
            isError={iconsError}
            disabled={isPending}
            hasError={Boolean(errors.iconId)}
          />
        </AdminFormField>

        <AdminFormField label={t('categories.form.coverImage')} required error={errors.imageUrl}>
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

        <AdminFormField
          label={t('categories.form.order')}
          required
          error={errors.order}
          hint={t('categories.form.orderHint')}
        >
          <NumberInput
            value={values.order}
            onChange={(v) => setValues((p) => ({ ...p, order: typeof v === 'number' ? v : 0 }))}
            clampMin={0}
            disabled={isPending}
            hasError={Boolean(errors.order)}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}

interface ReorderPanelProps {
  items: ApiCategory[];
  onReorder: (next: ApiCategory[]) => void;
  groups: ApiGroup[];
  dirtyCount: number;
  onSave: () => void;
  isSaving: boolean;
}

function ReorderPanel({
  items,
  onReorder,
  groups,
  dirtyCount,
  onSave,
  isSaving,
}: ReorderPanelProps) {
  const { t } = useTranslation('catalog');
  return (
    <div className="space-y-4">
      <SortableCategoryList
        items={items}
        onReorder={onReorder}
        groups={groups}
        disabled={isSaving}
      />
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {dirtyCount > 0
            ? t('categories.meta', { count: dirtyCount, total: items.length })
            : t('categories.reorder.noChanges')}
        </p>
        <Button
          onClick={onSave}
          disabled={dirtyCount === 0}
          isLoading={isSaving}
        >
          {t('categories.reorder.save')}
        </Button>
      </div>
    </div>
  );
}
