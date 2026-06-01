import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { type OfferType } from '@/config/constants';
import type { ApiOffer } from '@/shared/types/api';
import { emptyBilingual, toLocalized } from '@/shared/utils/bilingual';
import { formatEGP } from '@/shared/utils/format';
import { mapApiErrorsToFields } from '@/shared/utils/forms';

function offerTypeTone(type: OfferType): 'accent' | 'info' {
  return type === 'fixed_discount' ? 'accent' : 'info';
}

export function OffersPage() {
  const { t } = useTranslation('marketing');
  const { t: tCommon } = useTranslation('common');
  const offerTypeLabel = useCallback(
    (type: OfferType): string => t(`offers.types.${type}`),
    [t]
  );
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
        header: t('offers.columns.type'),
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
        header: t('offers.columns.description'),
        accessorFn: (o) => o.description.en,
        cell: ({ row }) => (
          <span
            className="line-clamp-3 max-w-md text-foreground"
            title={row.original.description.en}
          >
            {toLocalized(row.original.description)}
          </span>
        ),
      },
      {
        id: 'minOrder',
        header: t('offers.columns.minOrder'),
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
        header: t('offers.columns.discount'),
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) =>
          row.original.type === 'free_shipping' ? (
            <span className="text-muted-foreground">{t('offers.types.free_shipping')}</span>
          ) : (
            <span className="font-tabular font-medium text-foreground">
              {formatEGP(row.original.discountAmount ?? 0)}
            </span>
          ),
      },
      {
        id: 'active',
        header: t('offers.columns.active'),
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onCheckedChange={(checked) =>
              toggleOffer.mutate({ id: row.original._id, isActive: Boolean(checked) })
            }
            label={t('offers.ariaToggle', { name: row.original.description.en })}
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
              {tCommon('actions.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(row.original);
              }}
              aria-label={t('offers.ariaDelete')}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [toggleOffer, t, tCommon, offerTypeLabel]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t('offers.title')}
        subtitle={t('offers.subtitle')}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('offers.addOffer')}
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
          title: t('offers.empty.title'),
          description: t('offers.empty.description'),
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
                    label={t('offers.ariaToggle', { name: o.description.en })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">
                  {toLocalized(o.description)}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {t('offers.mobile.min', { value: formatEGP(o.minOrderAmount) })}
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
                {tCommon('actions.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(o);
                }}
                aria-label={t('offers.ariaDelete')}
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
        title={t('offers.confirm.delete.title')}
        description={t('offers.confirm.delete.description')}
        confirmLabel={t('offers.confirm.delete.confirmLabel')}
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
  const { t } = useTranslation('marketing');
  const { t: tCommon } = useTranslation('common');
  const offerTypeOptions: ReadonlyArray<SelectOption<OfferType>> = [
    { value: 'fixed_discount', label: t('offers.types.fixed_discount') },
    { value: 'free_shipping', label: t('offers.types.free_shipping') },
  ];
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
      title={isEdit ? t('offers.edit') : t('offers.new')}
      description={isEdit ? entity?.description.en : t('offers.form.newDescription')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? t('offers.form.save') : t('offers.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <AdminFormField label={t('offers.form.type')} required error={errors.type}>
            <Select<OfferType>
              value={type}
              onValueChange={(value) => {
                setType(value);
                if (value === 'free_shipping') setDiscountAmount('');
              }}
              options={offerTypeOptions}
              disabled={isPending}
              hasError={Boolean(errors.type)}
            />
          </AdminFormField>

          <AdminFormField label={t('offers.form.active')}>
            <div className="flex h-11 items-center">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                disabled={isPending}
                label={t('offers.form.active')}
              />
            </div>
          </AdminFormField>
        </div>

        <AdminFormField label={t('offers.form.banner')} required error={errors.image}>
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
          label={t('offers.form.description')}
          multiline
          required
          value={description}
          onChange={setDescription}
          error={errors.description}
          placeholder={{
            en: t('offers.form.descriptionPlaceholderEn'),
            ar: t('offers.form.descriptionPlaceholderAr'),
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminFormField label={t('offers.form.minOrder')} required error={errors.minOrderAmount}>
            <NumberInput
              value={minOrderAmount}
              onChange={setMinOrderAmount}
              suffix={tCommon('currencySuffix')}
              clampMin={0}
              hasError={Boolean(errors.minOrderAmount)}
              disabled={isPending}
              placeholder="0"
            />
          </AdminFormField>

          <AdminFormField
            label={t('offers.form.discount')}
            required={showDiscount}
            error={showDiscount ? errors.discountAmount : undefined}
            hint={
              showDiscount
                ? t('offers.form.discountHintApplied')
                : t('offers.form.discountHintIgnored')
            }
          >
            <NumberInput
              value={showDiscount ? discountAmount : ''}
              onChange={setDiscountAmount}
              suffix={tCommon('currencySuffix')}
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
