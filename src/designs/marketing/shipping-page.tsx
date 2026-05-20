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
  NumberInput,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import {
  useCreateShipping,
  useDeleteShipping,
  useShipping,
  useUpdateShipping,
} from '@/features/shipping/hooks/use-shipping';
import {
  shippingFormSchema,
  type ShippingFormValues,
} from '@/features/shipping/schemas/shipping-form';
import type { ApiShipping } from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { formatEGP } from '@/shared/utils/format';

export function ShippingPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiShipping | null>(null);
  const [deleting, setDeleting] = useState<ApiShipping | null>(null);

  const shippingQuery = useShipping();
  const deleteRegion = useDeleteShipping();

  const columns = useMemo<ColumnDef<ApiShipping>[]>(
    () => [
      {
        id: 'nameEn',
        header: 'Region (EN)',
        accessorFn: (s) => s.name.en,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name.en}</span>
        ),
      },
      {
        id: 'nameAr',
        header: 'Region (AR)',
        accessorFn: (s) => s.name.ar,
        cell: ({ row }) => (
          <span dir="rtl" className="font-body-ar text-muted-foreground">
            {row.original.name.ar}
          </span>
        ),
      },
      {
        id: 'cost',
        header: 'Cost',
        accessorFn: (s) => s.cost,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-foreground">
            {formatEGP(row.original.cost)}
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
        title="Shipping"
        subtitle="Regions and their delivery cost. Customers pick one at checkout."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add region
          </Button>
        }
      />

      <AdminTable
        data={shippingQuery.data}
        columns={columns}
        isLoading={shippingQuery.isPending}
        isError={shippingQuery.isError}
        error={shippingQuery.error}
        onRetry={() => shippingQuery.refetch()}
        getRowId={(s) => s._id}
        emptyState={{
          title: 'No shipping regions',
          description: 'Add one so customers can check out.',
        }}
      />

      <ShippingFormSheet
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
        description="Orders previously placed against this region keep their original cost. New checkouts will lose this option."
        confirmLabel="Delete region"
        isPending={deleteRegion.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteRegion.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

interface ShippingFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiShipping | null;
}

function ShippingFormSheet({ open, onClose, entity }: ShippingFormSheetProps) {
  const create = useCreateShipping();
  const update = useUpdateShipping();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const initial: { name: { en: string; ar: string }; cost: number | '' } = {
    name: entity?.name ?? emptyBilingual(),
    cost: entity?.cost ?? '',
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<{
    name?: { en?: string; ar?: string };
    cost?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const candidate = {
      name: values.name,
      cost: values.cost === '' ? Number.NaN : values.cost,
    };
    const parsed = shippingFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0] === 'name') {
          if (!next.name) next.name = {};
          const lang = iss.path[1] as 'en' | 'ar';
          if (lang && !next.name[lang]) next.name[lang] = iss.message;
        } else if (iss.path[0] === 'cost' && !next.cost) {
          next.cost = iss.message;
        }
      });
      setErrors(next);
      return;
    }
    const payload: ShippingFormValues = parsed.data;
    if (isEdit && entity) {
      update.mutate({ id: entity._id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={isEdit ? 'Edit region' : 'New region'}
      description={isEdit ? entity?.name.en : 'Customers see the EN name at checkout.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save changes' : 'Create region'}
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
          placeholder={{ en: 'Cairo', ar: 'القاهرة' }}
        />

        <AdminFormField label="Cost" required error={errors.cost}>
          <NumberInput
            value={values.cost}
            onChange={(cost) => setValues((p) => ({ ...p, cost }))}
            suffix="EGP"
            clampMin={0}
            hasError={Boolean(errors.cost)}
            disabled={isPending}
            placeholder="0"
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
