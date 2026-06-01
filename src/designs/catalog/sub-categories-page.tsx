import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { emptyBilingual, toLocalized } from '@/shared/utils/bilingual';
import { mapApiErrorsToFields } from '@/shared/utils/forms';
import { formatDate, formatGroupName } from '@/shared/utils/format';
import { idOf } from '@/shared/utils/relations';

type Tab = 'active' | 'deleted';

export function SubCategoriesPage() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
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
    categoriesQuery.data?.forEach((c) => map.set(c._id, toLocalized(c.name)));
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
        id: 'name',
        header: t('subCategories.columns.name'),
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
        id: 'category',
        header: t('subCategories.columns.category'),
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
        header: t('subCategories.columns.created'),
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
                aria-label={t('subCategories.aria.hide', { name: toLocalized(row.original.name) })}
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
                aria-label={t('subCategories.aria.permDelete', { name: toLocalized(row.original.name) })}
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          ),
      },
    ],
    [tab, categoryNameById, restore, t, tCommon]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t('subCategories.title')}
        subtitle={t('subCategories.subtitle')}
        action={
          <Button onClick={() => setCreating(true)} disabled={!categoriesQuery.data?.length}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('subCategories.addSubCategory')}
          </Button>
        }
        tabs={
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="active">{t('subCategories.tabs.active')}</TabsTrigger>
              <TabsTrigger value="deleted">{t('subCategories.tabs.deleted')}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('subCategories.searchPlaceholder')}
          filters={
            categoriesQuery.data && categoriesQuery.data.length > 0 ? (
              <Select
                value={categoryFilter || '__all'}
                onValueChange={(v) => setCategoryFilter(v === '__all' ? '' : v)}
                placeholder={t('subCategories.allCategories')}
                options={[
                  { value: '__all', label: t('subCategories.allCategories') },
                  ...categoriesQuery.data.map((c) => ({ value: c._id, label: toLocalized(c.name) })),
                ]}
                aria-label={t('subCategories.filterAria')}
                className="min-w-[180px]"
              />
            ) : null
          }
          meta={
            currentQuery.data
              ? t('subCategories.meta', { count: filteredData?.length ?? 0, total: currentQuery.data.length })
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
              <p className="truncate font-medium text-foreground">{toLocalized(c.name)}</p>
              <p
                dir="rtl"
                className="truncate font-body-ar text-xs text-muted-foreground"
              >
                {c.name.ar}
              </p>
              <p className="mt-0.5 text-xs text-light-foreground">
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
                    aria-label={t('subCategories.aria.edit', { name: toLocalized(c.name) })}
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
                    aria-label={t('subCategories.aria.hide', { name: toLocalized(c.name) })}
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
          title: tab === 'active' ? t('subCategories.empty.noSubCategories') : t('subCategories.empty.trashTitle'),
          description:
            tab === 'active'
              ? t('subCategories.empty.intro')
              : t('subCategories.empty.trash'),
          action:
            tab === 'active' && categoriesQuery.data?.length ? (
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={14} strokeWidth={1.5} aria-hidden />
                {t('subCategories.addSubCategory')}
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
        title={t('subCategories.confirm.soft.title', { name: softDeleting ? toLocalized(softDeleting.name) : '' })}
        description={t('subCategories.confirm.soft.description')}
        variant="warning"
        confirmLabel={t('subCategories.confirm.soft.confirmLabel')}
        isPending={softDelete.isPending}
        onConfirm={() => {
          if (!softDeleting) return;
          softDelete.mutate(softDeleting._id, { onSuccess: () => setSoftDeleting(null) });
        }}
      />

      <ConfirmDialog
        open={hardDeleting !== null}
        onOpenChange={(o) => !o && setHardDeleting(null)}
        title={t('subCategories.confirm.hard.title', { name: hardDeleting ? toLocalized(hardDeleting.name) : '' })}
        description={t('subCategories.confirm.hard.description')}
        confirmLabel={t('subCategories.confirm.hard.confirmLabel')}
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
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
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
        } else if (head === 'category') {
          next.category = msg;
        } else if (head === 'imageUrl') {
          next.imageUrl = msg;
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
      title={isEdit ? t('subCategories.edit') : t('subCategories.new')}
      description={isEdit && entity ? toLocalized(entity.name) : t('subCategories.form.newDescription')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending} disabled={!values.imageUrl}>
            {isEdit ? tCommon('actions.saveChanges') : t('subCategories.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormField label={t('subCategories.form.parentCategory')} required error={errors.category}>
          <SearchableSelect<ApiCategory>
            value={values.category || undefined}
            onChange={(v) => setValues((p) => ({ ...p, category: v ?? '' }))}
            items={categories}
            getKey={(c) => c._id}
            getLabel={(c) => toLocalized(c.name)}
            getSearchText={(c) => `${c.name.en} ${c.name.ar}`}
            placeholder={t('subCategories.form.pickCategory')}
            disabled={isPending}
            clearable={false}
          />
        </AdminFormField>

        <BilingualInput
          label={t('subCategories.form.name')}
          required
          value={values.name}
          onChange={(name) => setValues((p) => ({ ...p, name }))}
          error={errors.name}
          placeholder={{ en: t('subCategories.form.namePlaceholderEn'), ar: t('subCategories.form.namePlaceholderAr') }}
        />

        <AdminFormField label={t('subCategories.form.sizeGroup')} required error={errors.groupSize}>
          <SearchableSelect<ApiGroup>
            value={values.groupSize || undefined}
            onChange={(v) => setValues((p) => ({ ...p, groupSize: v ?? '' }))}
            items={groups}
            getKey={(g) => g._id}
            getLabel={(g) => formatGroupName(g.name)}
            placeholder={t('subCategories.form.pickSizeGroup')}
            disabled={isPending}
            clearable={false}
          />
        </AdminFormField>

        <AdminFormField label={t('subCategories.form.coverImage')} required error={errors.imageUrl}>
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
