import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
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
        header: t('icons.columns.key'),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">{row.original.key}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('icons.columns.status'),
        cell: ({ row }) => <ActiveBadge isActive={Boolean(row.original.isActive)} />,
      },
      {
        id: 'created',
        header: t('icons.columns.created'),
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
              {tCommon('actions.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(row.original);
              }}
              aria-label={t('icons.ariaDelete', { name: row.original.key })}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [t, tCommon]
  );

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t('icons.title')}
        subtitle={t('icons.subtitle')}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('icons.addIcon')}
          </Button>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('icons.searchPlaceholder')}
          meta={
            iconsQuery.data
              ? t('icons.meta', { count: filteredData?.length ?? 0, total: iconsQuery.data.length })
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
          title: t('icons.empty.title'),
          description: t('icons.empty.description'),
          action: (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus size={14} strokeWidth={1.5} aria-hidden />
              {t('icons.addIcon')}
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
        title={t('icons.confirm.delete.title', { name: deleting?.key ?? '' })}
        description={t('icons.confirm.delete.description')}
        confirmLabel={t('icons.confirm.delete.confirmLabel')}
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
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
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
      title={isEdit ? t('icons.edit') : t('icons.new')}
      description={
        isEdit
          ? t('icons.form.editDescription', { name: entity?.key ?? '' })
          : t('icons.form.newDescription')
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? tCommon('actions.saveChanges') : t('icons.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField
          label={t('icons.form.key')}
          required
          hint={isEdit ? t('icons.form.keyHintEdit') : t('icons.form.keyHintNew')}
          error={errors.key}
        >
          <Input
            value={values.key}
            onChange={(e) => setValues((p) => ({ ...p, key: e.target.value }))}
            placeholder={t('icons.form.keyPlaceholder')}
            disabled={isEdit || isPending}
            hasError={Boolean(errors.key)}
            autoComplete="off"
            spellCheck={false}
          />
        </AdminFormField>

        <AdminFormField label={t('icons.form.svg')} required error={errors.svg}>
          <Textarea
            value={values.svg}
            onChange={(e) => setValues((p) => ({ ...p, svg: e.target.value }))}
            placeholder={t('icons.form.svgPlaceholder')}
            rows={6}
            hasError={Boolean(errors.svg)}
            spellCheck={false}
            className="font-mono text-xs"
          />
        </AdminFormField>

        <AdminFormField label={t('icons.form.preview')}>
          <Card className="flex min-h-[120px] items-center justify-center bg-muted/40">
            {values.svg ? (
              <IconPreview svg={values.svg} size="xl" />
            ) : (
              <span className="text-xs text-light-foreground">
                {t('icons.form.previewPrompt')}
              </span>
            )}
          </Card>
        </AdminFormField>

        <AdminFormField
          label={t('icons.form.active')}
          hint={t('icons.form.activeHint')}
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
