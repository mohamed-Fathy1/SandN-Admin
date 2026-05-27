import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  ActiveBadge,
  AdminFormField,
  AdminTable,
  Button,
  Card,
  ConfirmDialog,
  FormSheet,
  Input,
  Switch,
  TableToolbar,
  Textarea,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import {
  useCreateIcon,
  useDeleteIcon,
  useIcons,
  useUpdateIcon,
} from '@/features/catalog/icons/hooks/use-icons';
import {
  iconFormSchema,
  type IconFormValues,
} from '@/features/catalog/icons/schemas/icon-form';
import type { ApiCategoryIcon } from '@/shared/types/api';
import { formatDate } from '@/shared/utils/format';
import { mapApiErrorsToFields } from '@/shared/utils/forms';

export function IconsPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiCategoryIcon | null>(null);
  const [deleting, setDeleting] = useState<ApiCategoryIcon | null>(null);
  const [search, setSearch] = useState('');

  const iconsQuery = useIcons();
  const deleteIcon = useDeleteIcon();

  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = useMemo(() => {
    if (!normalizedSearch) return iconsQuery.data;
    return iconsQuery.data?.filter((i) => i.key.toLowerCase().includes(normalizedSearch));
  }, [iconsQuery.data, normalizedSearch]);
  const isFiltered = normalizedSearch.length > 0;

  const columns = useMemo<ColumnDef<ApiCategoryIcon>[]>(
    () => [
      {
        id: 'preview',
        header: '',
        enableSorting: false,
        size: 56,
        cell: ({ row }) => <IconPreview svg={row.original.svg} size="md" />,
      },
      {
        accessorKey: 'key',
        header: 'Key',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">{row.original.key}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <ActiveBadge isActive={Boolean(row.original.isActive)} />,
      },
      {
        id: 'created',
        header: 'Created',
        accessorFn: (i) => i.createdAt ?? '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
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
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(row.original);
              }}
              aria-label={`Delete ${row.original.key}`}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title="Category Icons"
        subtitle="Reusable SVG icons assigned to categories. Keys must be unique."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add icon
          </Button>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search icons by key…"
          meta={
            iconsQuery.data
              ? `${filteredData?.length ?? 0} of ${iconsQuery.data.length}`
              : undefined
          }
        />
      </div>

      <AdminTable
        data={filteredData}
        columns={columns}
        isLoading={iconsQuery.isPending}
        isError={iconsQuery.isError}
        error={iconsQuery.error}
        onRetry={() => iconsQuery.refetch()}
        getRowId={(i) => i._id}
        isFiltered={isFiltered}
        onClearFilters={() => setSearch('')}
        emptyState={{
          title: 'No icons yet',
          description: 'Add SVG icons before assigning them to categories.',
          action: (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus size={14} strokeWidth={1.5} aria-hidden />
              Add icon
            </Button>
          ),
        }}
      />

      <IconFormSheet
        key={editing?._id ?? (creating ? 'create' : 'closed')}
        open={sheetOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        entity={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.key}"?`}
        description="Categories assigned to this icon will lose their icon link. This action cannot be undone."
        confirmLabel="Delete icon"
        isPending={deleteIcon.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteIcon.mutate(deleting.key, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

interface IconFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiCategoryIcon | null;
}

function IconFormSheet({ open, onClose, entity }: IconFormSheetProps) {
  const create = useCreateIcon();
  const update = useUpdateIcon();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: IconFormValues = {
    key: entity?.key ?? '',
    svg: entity?.svg ?? '',
    isActive: entity?.isActive ?? true,
  };
  const [values, setValues] = useState<IconFormValues>(initial);
  const [errors, setErrors] = useState<{
    key?: string;
    svg?: string;
    isActive?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = iconFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((iss) => {
        const head = iss.path[0] as keyof typeof errors;
        if (head && !next[head]) next[head] = iss.message;
      });
      setErrors(next);
      return;
    }
    const onError = (err: unknown) => {
      const fieldMap = mapApiErrorsToFields(err);
      if (!fieldMap) return;
      const next: typeof errors = {};
      for (const [path, msg] of Object.entries(fieldMap)) {
        const head = path.split('.')[0] as keyof typeof errors;
        if (head && !next[head]) next[head] = msg;
      }
      setErrors(next);
    };
    if (isEdit && entity) {
      update.mutate(
        { key: entity.key, payload: { svg: parsed.data.svg, isActive: parsed.data.isActive } },
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
      title={isEdit ? 'Edit icon' : 'New icon'}
      description={
        isEdit
          ? `Update the SVG markup or toggle availability for "${entity?.key}".`
          : 'Paste SVG markup and give it a unique key.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save changes' : 'Create icon'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField
          label="Key"
          required
          hint={isEdit ? 'Key is immutable once set.' : 'Lowercase letters, numbers, dashes.'}
          error={errors.key}
        >
          <Input
            value={values.key}
            onChange={(e) => setValues((p) => ({ ...p, key: e.target.value }))}
            placeholder="bras"
            disabled={isEdit || isPending}
            hasError={Boolean(errors.key)}
            autoComplete="off"
            spellCheck={false}
          />
        </AdminFormField>

        <AdminFormField label="SVG markup" required error={errors.svg}>
          <Textarea
            value={values.svg}
            onChange={(e) => setValues((p) => ({ ...p, svg: e.target.value }))}
            placeholder="<svg viewBox='0 0 24 24'>…</svg>"
            rows={6}
            hasError={Boolean(errors.svg)}
            spellCheck={false}
            className="font-mono text-xs"
          />
        </AdminFormField>

        <AdminFormField label="Preview">
          <Card className="flex min-h-[120px] items-center justify-center bg-muted/40">
            {values.svg ? (
              <IconPreview svg={values.svg} size="xl" />
            ) : (
              <span className="text-xs text-light-foreground">
                Paste SVG markup to see a preview.
              </span>
            )}
          </Card>
        </AdminFormField>

        <AdminFormField
          label="Active"
          hint="Inactive icons stay in the library but are hidden from category pickers."
        >
          <Switch
            checked={values.isActive}
            onCheckedChange={(v) => setValues((p) => ({ ...p, isActive: v }))}
            disabled={isPending}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}

interface IconPreviewProps {
  svg: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASS: Record<NonNullable<IconPreviewProps['size']>, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
};

export function IconPreview({ svg, size = 'md' }: IconPreviewProps) {
  return (
    <span
      role="img"
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full ${SIZE_CLASS[size]}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
