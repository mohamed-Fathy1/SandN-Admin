import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import {
  AdminFormField,
  AdminTable,
  Button,
  FormSheet,
  Select,
  type SelectOption,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useGroups, useCreateGroup, useUpdateGroup } from '@/features/catalog/groups/hooks/use-groups';
import { groupFormSchema, type GroupFormValues } from '@/features/catalog/groups/schemas/group-form';
import { GROUP_NAMES, type GroupName } from '@/config/constants';
import type { ApiGroup } from '@/shared/types/api';
import { formatDate } from '@/shared/utils/format';

const GROUP_OPTIONS: ReadonlyArray<SelectOption<GroupName>> = GROUP_NAMES.map((name) => ({
  value: name,
  label: name === 'letters' ? 'Letters (S, M, L…)' : 'Numeric (36, 38, 40…)',
}));

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
          <span className="font-medium capitalize text-foreground">{row.original.name}</span>
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

  const usedNames = new Set(groupsQuery.data?.map((g) => g.name) ?? []);
  const allUsed = GROUP_NAMES.every((n) => usedNames.has(n));

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="Size groups define whether a category uses letter-style or numeric sizing."
        action={
          <Button onClick={() => setCreating(true)} disabled={allUsed}>
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
        excludeNames={editing ? usedNames : usedNames}
      />
    </>
  );
}

interface GroupFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiGroup | null;
  excludeNames: Set<GroupName>;
}

function GroupFormSheet({ open, onClose, entity, excludeNames }: GroupFormSheetProps) {
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: GroupFormValues = { name: entity?.name ?? GROUP_NAMES[0] };
  const [values, setValues] = useState<GroupFormValues>(initial);
  const [error, setError] = useState<string | undefined>();

  const availableOptions = GROUP_OPTIONS.filter((opt) => {
    if (entity?.name === opt.value) return true;
    return !excludeNames.has(opt.value);
  });

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
      description={isEdit ? entity?.name : 'Pick a sizing style for this group.'}
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
        <AdminFormField label="Sizing style" required error={error}>
          <Select<GroupName>
            value={values.name}
            onValueChange={(v) => setValues({ name: v })}
            options={availableOptions}
            placeholder="Select sizing style"
            disabled={isPending}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
