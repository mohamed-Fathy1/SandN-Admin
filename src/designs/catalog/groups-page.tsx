import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AdminFormField,
  AdminTable,
  Button,
  FormSheet,
  Input,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useGroups, useCreateGroup, useUpdateGroup } from '@/features/catalog/groups/hooks/use-groups';
import { groupFormSchema, type GroupFormValues } from '@/features/catalog/groups/schemas/group-form';
import type { ApiGroup } from '@/shared/types/api';
import { formatDate, formatGroupName } from '@/shared/utils/format';

export function GroupsPage() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiGroup | null>(null);
  const sheetOpen = creating || editing !== null;

  const groupsQuery = useGroups();

  const columns = useMemo<ColumnDef<ApiGroup>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('groups.columns.name'),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{formatGroupName(row.original.name)}</span>
        ),
      },
      {
        id: 'created',
        header: t('groups.columns.created'),
        accessorFn: (g) => g.createdAt ?? '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
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
          </div>
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <>
      <PageHeader
        title={t('groups.title')}
        subtitle={t('groups.subtitle')}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('groups.addGroup')}
          </Button>
        }
      />

      <AdminTable
        data={groupsQuery.data}
        columns={columns}
        isLoading={groupsQuery.isPending}
        isError={groupsQuery.isError}
        error={groupsQuery.error}
        onRetry={() => groupsQuery.refetch()}
        getRowId={(g) => g._id}
        emptyState={{
          title: t('groups.empty.title'),
          description: t('groups.empty.description'),
        }}
      />

      <GroupFormSheet
        key={editing?._id ?? (creating ? 'create' : 'closed')}
        open={sheetOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        entity={editing}
      />
    </>
  );
}

interface GroupFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiGroup | null;
}

function GroupFormSheet({ open, onClose, entity }: GroupFormSheetProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const [values, setValues] = useState<GroupFormValues>({ name: entity?.name ?? '' });
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = groupFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('groups.form.invalid'));
      return;
    }
    if (isEdit && entity) {
      update.mutate(
        { id: entity._id, payload: parsed.data },
        { onSuccess: onClose }
      );
    } else {
      create.mutate(parsed.data, { onSuccess: onClose });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={isEdit ? t('groups.edit') : t('groups.new')}
      description={isEdit ? entity?.name : t('groups.form.newDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? tCommon('actions.saveChanges') : t('groups.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField label={t('groups.form.name')} required error={error}>
          <Input
            value={values.name}
            onChange={(e) => setValues({ name: e.target.value })}
            placeholder={t('groups.form.namePlaceholder')}
            disabled={isPending}
            autoFocus
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
