import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
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
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiGroup | null>(null);
  const sheetOpen = creating || editing !== null;

  const groupsQuery = useGroups();

  const columns = useMemo<ColumnDef<ApiGroup>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{formatGroupName(row.original.name)}</span>
        ),
      },
      {
        id: 'created',
        header: 'Created',
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
              Edit
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="Size groups define whether a category uses letter-style or numeric sizing."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add group
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
          title: 'No size groups yet',
          description: 'Create a group before adding individual sizes or categories.',
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
      setError(parsed.error.issues[0]?.message ?? 'Invalid');
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
      title={isEdit ? 'Edit group' : 'New group'}
      description={isEdit ? entity?.name : 'Give this sizing group a name.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save changes' : 'Create group'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField label="Name" required error={error}>
          <Input
            value={values.name}
            onChange={(e) => setValues({ name: e.target.value })}
            placeholder="e.g. letters, numeric, one size"
            disabled={isPending}
            autoFocus
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
