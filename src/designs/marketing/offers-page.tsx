import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AdminFormField,
  AdminImageUploader,
  AdminTable,
  BilingualInput,
  Button,
  ConfirmDialog,
  FormSheet,
  GenericBadge,
  NumberInput,
  Select,
  Switch,
  Thumbnail,
  type SelectOption,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import {
  useCreateOffer,
  useDeleteOffer,
  useOffers,
  useToggleOffer,
  useUpdateOffer,
} from '@/features/offers/hooks/use-offers';
import type { OfferPayload } from '@/features/offers/hooks/use-offers';
import { offerFormSchema } from '@/features/offers/schemas/offer-form';
import { CURRENCY_SUFFIX, type OfferType } from '@/config/constants';
import type { ApiOffer } from '@/shared/types/api';
import { emptyBilingual } from '@/shared/utils/bilingual';
import { formatEGP } from '@/shared/utils/format';
import { mapApiErrorsToFields } from '@/shared/utils/forms';

const OFFER_TYPE_OPTIONS: ReadonlyArray<SelectOption<OfferType>> = [
  { value: 'fixed_discount', label: 'Fixed discount' },
  { value: 'free_shipping', label: 'Free shipping' },
];

function offerTypeLabel(type: OfferType): string {
  return type === 'fixed_discount' ? 'Fixed discount' : 'Free shipping';
}

function offerTypeTone(type: OfferType): 'accent' | 'info' {
  return type === 'fixed_discount' ? 'accent' : 'info';
}

export function OffersPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiOffer | null>(null);
  const [deleting, setDeleting] = useState<ApiOffer | null>(null);

  const offersQuery = useOffers();
  const toggleOffer = useToggleOffer();
  const deleteOffer = useDeleteOffer();

  const columns = useMemo<ColumnDef<ApiOffer>[]>(
    () => [
      {
        id: 'image',
        header: '',
        enableSorting: false,
        size: 60,
        cell: ({ row }) => <Thumbnail src={row.original.image?.mediaUrl} size="sm" />,
      },
      {
        id: 'type',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) => (
          <GenericBadge
            label={offerTypeLabel(row.original.type)}
            tone={offerTypeTone(row.original.type)}
            size="sm"
          />
        ),
      },
      {
        id: 'description',
        header: 'Description',
        accessorFn: (o) => o.description.en,
        cell: ({ row }) => (
          <span
            className="line-clamp-3 max-w-md text-foreground"
            title={row.original.description.en}
          >
            {row.original.description.en}
          </span>
        ),
      },
      {
        id: 'minOrder',
        header: 'Min order',
        accessorFn: (o) => o.minOrderAmount,
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="font-tabular text-foreground">
            {formatEGP(row.original.minOrderAmount)}
          </span>
        ),
      },
      {
        id: 'discount',
        header: 'Discount',
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) =>
          row.original.type === 'free_shipping' ? (
            <span className="text-muted-foreground">Free shipping</span>
          ) : (
            <span className="font-tabular font-medium text-foreground">
              {formatEGP(row.original.discountAmount ?? 0)}
            </span>
          ),
      },
      {
        id: 'active',
        header: 'Active',
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onCheckedChange={(checked) =>
              toggleOffer.mutate({ id: row.original._id, isActive: Boolean(checked) })
            }
            label={`Toggle ${row.original.description.en}`}
            onClick={(e) => e.stopPropagation()}
          />
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
              aria-label="Delete offer"
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [toggleOffer]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title="Offers"
        subtitle="Promotions applied automatically at checkout when the minimum is met."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add offer
          </Button>
        }
      />

      <AdminTable
        data={offersQuery.data}
        columns={columns}
        isLoading={offersQuery.isPending}
        isError={offersQuery.isError}
        error={offersQuery.error}
        onRetry={() => offersQuery.refetch()}
        getRowId={(o) => o._id}
        emptyState={{
          title: 'No offers',
          description: 'Create an offer to start running promotions.',
        }}
        mobileRender={(o) => (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-3">
              <Thumbnail src={o.image?.mediaUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <GenericBadge
                    label={offerTypeLabel(o.type)}
                    tone={offerTypeTone(o.type)}
                    size="sm"
                  />
                  <Switch
                    checked={o.isActive}
                    onCheckedChange={(checked) =>
                      toggleOffer.mutate({ id: o._id, isActive: Boolean(checked) })
                    }
                    label={`Toggle ${o.description.en}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">
                  {o.description.en}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  Min {formatEGP(o.minOrderAmount)}
                  {o.type === 'fixed_discount' ? (
                    <>
                      <span className="mx-1.5 text-light-foreground">·</span>
                      <span className="font-medium text-foreground">
                        − {formatEGP(o.discountAmount ?? 0)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(o);
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
                  setDeleting(o);
                }}
                aria-label="Delete offer"
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          </div>
        )}
      />

      <OfferFormSheet
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
        title="Delete this offer?"
        description="It will stop being applied to new orders immediately."
        confirmLabel="Delete offer"
        isPending={deleteOffer.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteOffer.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

interface OfferFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiOffer | null;
}

interface OfferFormErrors {
  type?: string;
  image?: string;
  description?: { en?: string; ar?: string };
  minOrderAmount?: string;
  discountAmount?: string;
}

function OfferFormSheet({ open, onClose, entity }: OfferFormSheetProps) {
  const create = useCreateOffer();
  const update = useUpdateOffer();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const [type, setType] = useState<OfferType>(entity?.type ?? 'fixed_discount');
  const [isActive, setIsActive] = useState(entity?.isActive ?? true);
  const [image, setImage] = useState(entity?.image?.mediaUrl ?? '');
  const [description, setDescription] = useState(entity?.description ?? emptyBilingual());
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(entity?.minOrderAmount ?? '');
  const [discountAmount, setDiscountAmount] = useState<number | ''>(entity?.discountAmount ?? '');
  const [errors, setErrors] = useState<OfferFormErrors>({});

  const showDiscount = type === 'fixed_discount';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const candidate: Record<string, unknown> = {
      type,
      isActive,
      image,
      description,
      minOrderAmount: minOrderAmount === '' ? Number.NaN : minOrderAmount,
    };
    if (showDiscount) {
      candidate.discountAmount = discountAmount === '' ? Number.NaN : discountAmount;
    }
    const parsed = offerFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: OfferFormErrors = {};
      parsed.error.issues.forEach((iss) => {
        const head = iss.path[0];
        if (head === 'description') {
          if (!next.description) next.description = {};
          const lang = iss.path[1] as 'en' | 'ar';
          if (lang && !next.description[lang]) next.description[lang] = iss.message;
        } else if (head === 'image' && !next.image) {
          next.image = iss.message;
        } else if (head === 'minOrderAmount' && !next.minOrderAmount) {
          next.minOrderAmount = iss.message;
        } else if (head === 'discountAmount' && !next.discountAmount) {
          next.discountAmount = iss.message;
        } else if (head === 'type' && !next.type) {
          next.type = iss.message;
        }
      });
      setErrors(next);
      return;
    }
    const payload: OfferPayload = {
      type: parsed.data.type,
      isActive: parsed.data.isActive,
      image: parsed.data.image,
      description: parsed.data.description,
      minOrderAmount: parsed.data.minOrderAmount,
      // Spec: free_shipping always sends discountAmount: 0.
      discountAmount:
        parsed.data.type === 'fixed_discount' ? (parsed.data.discountAmount ?? 0) : 0,
    };
    const onError = (err: unknown) => {
      const fieldMap = mapApiErrorsToFields(err);
      if (!fieldMap) return;
      const next: OfferFormErrors = {};
      for (const [path, msg] of Object.entries(fieldMap)) {
        const [head, leaf] = path.split('.');
        if (head === 'description' && (leaf === 'en' || leaf === 'ar')) {
          next.description = { ...(next.description ?? {}), [leaf]: msg };
        } else if (head === 'image') {
          next.image = msg;
        } else if (head === 'minOrderAmount') {
          next.minOrderAmount = msg;
        } else if (head === 'discountAmount') {
          next.discountAmount = msg;
        } else if (head === 'type') {
          next.type = msg;
        }
      }
      setErrors(next);
    };
    if (isEdit && entity) {
      update.mutate({ id: entity._id, payload }, { onSuccess: onClose, onError });
    } else {
      create.mutate(payload, { onSuccess: onClose, onError });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={isEdit ? 'Edit offer' : 'New offer'}
      description={isEdit ? entity?.description.en : 'Pick a type, set the threshold, go live.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save offer' : 'Create offer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <AdminFormField label="Type" required error={errors.type}>
            <Select<OfferType>
              value={type}
              onValueChange={(value) => {
                setType(value);
                if (value === 'free_shipping') setDiscountAmount('');
              }}
              options={OFFER_TYPE_OPTIONS}
              disabled={isPending}
              hasError={Boolean(errors.type)}
            />
          </AdminFormField>

          <AdminFormField label="Active">
            <div className="flex h-11 items-center">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                disabled={isPending}
                label="Active"
              />
            </div>
          </AdminFormField>
        </div>

        <AdminFormField label="Banner" required error={errors.image}>
          <AdminImageUploader
            folder="Offers"
            value={image || undefined}
            onChange={setImage}
            onClear={() => setImage('')}
            disabled={isPending}
            aspectRatio="16 / 9"
            hasError={Boolean(errors.image)}
          />
        </AdminFormField>

        <BilingualInput
          label="Description"
          multiline
          required
          value={description}
          onChange={setDescription}
          error={errors.description}
          placeholder={{
            en: 'Free shipping on orders above 500 EGP',
            ar: 'شحن مجاني عند الشراء بـ 500 جنيه',
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminFormField label="Min order amount" required error={errors.minOrderAmount}>
            <NumberInput
              value={minOrderAmount}
              onChange={setMinOrderAmount}
              suffix={CURRENCY_SUFFIX}
              clampMin={0}
              hasError={Boolean(errors.minOrderAmount)}
              disabled={isPending}
              placeholder="0"
            />
          </AdminFormField>

          <AdminFormField
            label="Discount amount"
            required={showDiscount}
            error={showDiscount ? errors.discountAmount : undefined}
            hint={
              showDiscount
                ? 'Subtracted from the order total.'
                : 'Only applies to "Fixed discount" offers.'
            }
          >
            <NumberInput
              value={showDiscount ? discountAmount : ''}
              onChange={setDiscountAmount}
              suffix={CURRENCY_SUFFIX}
              clampMin={0}
              hasError={Boolean(showDiscount && errors.discountAmount)}
              disabled={isPending || !showDiscount}
              placeholder="0"
            />
          </AdminFormField>
        </div>

      </form>
    </FormSheet>
  );
}
