import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AdminFormField,
  AdminTable,
  Button,
  ConfirmDialog,
  FormSheet,
  Input,
  NumberInput,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  type SelectOption,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useGroups } from '@/features/catalog/groups/hooks/use-groups';
import {
  useCreateSize,
  useDeleteSize,
  useSizes,
  useUpdateSize,
} from '@/features/catalog/sizes/hooks/use-sizes';
import { sizeFormSchema, type SizeFormValues } from '@/features/catalog/sizes/schemas/size-form';
import type { ApiGroup, ApiSize } from '@/shared/types/api';
import { formatGroupName } from '@/shared/utils/format';
import { idOf } from '@/shared/utils/relations';

export function SizesPage() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiSize | null>(null);
  const [deleting, setDeleting] = useState<ApiSize | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const sizesQuery = useSizes();
  const groupsQuery = useGroups();
  const deleteSize = useDeleteSize();

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    groupsQuery.data?.forEach((g) => map.set(g._id, formatGroupName(g.name)));
    return map;
  }, [groupsQuery.data]);

  const filtered = useMemo(() => {
    const all = sizesQuery.data ?? [];
    if (groupFilter === 'all') return all;
    return all.filter((s) => {
      const gid = typeof s.groupSize === 'string' ? s.groupSize : s.groupSize._id;
      return gid === groupFilter;
    });
  }, [sizesQuery.data, groupFilter]);

  const columns = useMemo<ColumnDef<ApiSize>[]>(
    () => [
      {
        accessorKey: 'size',
        header: t('sizes.columns.size'),
        cell: ({ row }) => (
          <span className="font-mono font-medium uppercase text-foreground">
            {row.original.size}
          </span>
        ),
      },
      {
        id: 'group',
        header: t('sizes.columns.group'),
        accessorFn: (s) => idOf(s.groupSize),
        cell: ({ row }) => {
          const gid = idOf(row.original.groupSize);
          return (
            <span className="text-muted-foreground">{groupNameById.get(gid) ?? '—'}</span>
          );
        },
      },
      {
        accessorKey: 'order',
        header: t('sizes.columns.order'),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.original.order}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
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
                setDeleting(row.original);
              }}
              aria-label={t('sizes.ariaDelete', { name: row.original.size })}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [groupNameById, t, tCommon]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t('sizes.title')}
        subtitle={t('sizes.subtitle')}
        action={
          <Button onClick={() => setCreating(true)} disabled={!groupsQuery.data?.length}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('sizes.addSize')}
          </Button>
        }
        tabs={
          groupsQuery.data && groupsQuery.data.length > 0 ? (
            <Tabs value={groupFilter} onValueChange={setGroupFilter}>
              <TabsList>
                <TabsTrigger value="all">{t('sizes.tabAll')}</TabsTrigger>
                {groupsQuery.data.map((g) => (
                  <TabsTrigger key={g._id} value={g._id}>
                    {formatGroupName(g.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null
        }
      />

      <AdminTable
        data={filtered}
        columns={columns}
        isLoading={sizesQuery.isPending}
        isError={sizesQuery.isError}
        error={sizesQuery.error}
        onRetry={() => sizesQuery.refetch()}
        getRowId={(s) => s._id}
        emptyState={{
          title: t('sizes.empty.title'),
          description: t('sizes.empty.description'),
        }}
      />

      <SizeFormSheet
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
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('sizes.confirm.delete.title', { name: deleting?.size ?? '' })}
        description={t('sizes.confirm.delete.description')}
        confirmLabel={t('sizes.confirm.delete.confirmLabel')}
        isPending={deleteSize.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteSize.mutate(deleting._id, {
            onSuccess: () => setDeleting(null),
          });
        }}
      />
    </>
  );
}

interface SizeFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiSize | null;
  groups: ApiGroup[];
}

function SizeFormSheet({ open, onClose, entity, groups }: SizeFormSheetProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const create = useCreateSize();
  const update = useUpdateSize();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: SizeFormValues = {
    groupSize: entity ? idOf(entity.groupSize) : (groups[0]?._id ?? ''),
    size: entity?.size ?? '',
    order: entity?.order ?? 0,
  };
  const [values, setValues] = useState<SizeFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof SizeFormValues, string>>>({});

  const groupOptions: SelectOption[] = groups.map((g) => ({
    value: g._id,
    label: formatGroupName(g.name),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = sizeFormSchema.safeParse(values);
    if (!parsed.success) {
      const map: Partial<Record<keyof SizeFormValues, string>> = {};
      parsed.error.issues.forEach((iss) => {
        const key = iss.path[0] as keyof SizeFormValues;
        if (key && !map[key]) map[key] = iss.message;
      });
      setErrors(map);
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
      title={isEdit ? t('sizes.edit') : t('sizes.new')}
      description={isEdit ? entity?.size : t('sizes.form.newDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? tCommon('actions.saveChanges') : t('sizes.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField label={t('sizes.form.group')} required error={errors.groupSize}>
          <Select
            value={values.groupSize || undefined}
            onValueChange={(v) => setValues((p) => ({ ...p, groupSize: v }))}
            options={groupOptions}
            placeholder={t('sizes.form.pickGroup')}
            disabled={isPending}
          />
        </AdminFormField>

        <AdminFormField label={t('sizes.form.size')} required error={errors.size} hint={t('sizes.form.sizeHint')}>
          <Input
            value={values.size}
            onChange={(e) => setValues((p) => ({ ...p, size: e.target.value }))}
            placeholder={t('sizes.form.sizePlaceholder')}
            disabled={isPending}
            maxLength={12}
          />
        </AdminFormField>

        <AdminFormField label={t('sizes.form.order')} required error={errors.order} hint={t('sizes.form.orderHint')}>
          <NumberInput
            value={values.order}
            onChange={(v) => setValues((p) => ({ ...p, order: typeof v === 'number' ? v : 0 }))}
            disabled={isPending}
            clampMin={0}
            clampMax={999}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
