import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AdminFormField,
  AdminTable,
  BilingualInput,
  Button,
  ConfirmDialog,
  FormSheet,
  HexColorInput,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { A } from '@/designs/layout/tokens';
import {
  useColors,
  useCreateColor,
  useDeleteColor,
  useUpdateColor,
} from '@/features/catalog/colors/hooks/use-colors';
import {
  colorFormSchema,
  type ColorFormValues,
} from '@/features/catalog/colors/schemas/color-form';
import type { ApiColor } from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { mapApiErrorsToFields } from '@/shared/utils/forms';

export function ColorsPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiColor | null>(null);
  const [deleting, setDeleting] = useState<ApiColor | null>(null);

  const colorsQuery = useColors();
  const deleteColor = useDeleteColor();

  const columns = useMemo<ColumnDef<ApiColor>[]>(
    () => [
      {
        id: 'swatch',
        header: '',
        enableSorting: false,
        size: 48,
        cell: ({ row }) => (
          <span
            className="inline-block h-6 w-6 rounded-full border border-border-medium"
            style={{ background: row.original.hex }}
            aria-hidden
          />
        ),
      },
      {
        id: 'name',
        header: 'Name',
        accessorFn: (c) => c.name.en,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.name.en}</p>
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
        accessorKey: 'hex',
        header: 'Hex',
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase text-muted-foreground">
            {row.original.hex}
          </span>
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
              aria-label={`Delete ${row.original.name.en}`}
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
        title="Colors"
        subtitle="Colors are reused across product variants. Keep the palette tight."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add color
          </Button>
        }
      />

      <AdminTable
        data={colorsQuery.data}
        columns={columns}
        isLoading={colorsQuery.isPending}
        isError={colorsQuery.isError}
        error={colorsQuery.error}
        onRetry={() => colorsQuery.refetch()}
        getRowId={(c) => c._id}
        emptyState={{
          title: 'No colors yet',
          description: 'Add colors before creating product variants.',
        }}
      />

      <ColorFormSheet
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
        title={`Delete "${deleting?.name.en}"?`}
        description="Any product variant using this color will keep its existing hex but lose this label. This action cannot be undone."
        confirmLabel="Delete color"
        isPending={deleteColor.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteColor.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

interface ColorFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiColor | null;
}

function ColorFormSheet({ open, onClose, entity }: ColorFormSheetProps) {
  const create = useCreateColor();
  const update = useUpdateColor();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: ColorFormValues = {
    name: entity?.name ?? emptyBilingual(),
    hex: entity?.hex ?? A.accent,
  };
  const [values, setValues] = useState<ColorFormValues>(initial);
  const [errors, setErrors] = useState<{
    name?: { en?: string; ar?: string };
    hex?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = colorFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0] === 'name') {
          if (!next.name) next.name = {};
          const lang = iss.path[1] as 'en' | 'ar';
          if (lang && !next.name[lang]) next.name[lang] = iss.message;
        } else if (iss.path[0] === 'hex' && !next.hex) {
          next.hex = iss.message;
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
        } else if (head === 'hex') {
          next.hex = msg;
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
      title={isEdit ? 'Edit color' : 'New color'}
      description={isEdit ? entity?.name.en : 'Define both names + hex.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save changes' : 'Create color'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <BilingualInput
          label="Name"
          required
          value={values.name}
          onChange={(name) => setValues((p) => ({ ...p, name }))}
          error={errors.name}
          placeholder={{ en: 'Dusty Rose', ar: 'وردي مغبر' }}
        />

        <AdminFormField label="Hex" required error={errors.hex}>
          <HexColorInput
            value={values.hex}
            onChange={(hex) => setValues((p) => ({ ...p, hex }))}
            disabled={isPending}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
