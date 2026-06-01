import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AdminFormField,
  AdminImageUploader,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormSheet,
  QueryErrorState,
  CardGridSkeleton,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import {
  useCreateHeroSection,
  useDeleteHeroSection,
  useHeroSections,
  useUpdateHeroSection,
} from '@/features/hero/hooks/use-hero';
import type { HeroPayload } from '@/features/hero/hooks/use-hero';
import { findHeroImageUrl } from '@/features/hero/api/hero';
import type { ApiHeroSection } from '@/shared/types/api';

export function HeroPage() {
  const { t } = useTranslation('marketing');
  const { t: tCommon } = useTranslation('common');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiHeroSection | null>(null);
  const [deleting, setDeleting] = useState<ApiHeroSection | null>(null);

  const heroQuery = useHeroSections();
  const deleteHero = useDeleteHeroSection();

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {t('hero.addSlide')}
          </Button>
        }
      />

      {heroQuery.isPending ? (
        <CardGridSkeleton count={3} />
      ) : heroQuery.isError ? (
        <QueryErrorState error={heroQuery.error} onRetry={() => heroQuery.refetch()} />
      ) : !heroQuery.data || heroQuery.data.length === 0 ? (
        <EmptyState
          title={t('hero.empty.title')}
          description={t('hero.empty.description')}
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} strokeWidth={1.5} aria-hidden />
              {t('hero.addFirstSlide')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroQuery.data.map((hero) => (
            <Card key={hero._id} padding="none" className="group overflow-hidden">
              <div className="flex flex-col gap-2 p-3 sm:flex-row">
                <div className="overflow-hidden rounded-lg bg-muted sm:w-1/3 sm:shrink-0">
                  <img
                    src={findHeroImageUrl(hero, 'small')}
                    alt={t('hero.alt.small')}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={findHeroImageUrl(hero, 'large')}
                    alt={t('hero.alt.large')}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(hero)}>
                  <Pencil size={14} strokeWidth={1.5} aria-hidden />
                  {tCommon('actions.edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(hero)}
                  aria-label={t('hero.ariaDelete')}
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <HeroFormSheet
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
        title={t('hero.confirm.delete.title')}
        description={t('hero.confirm.delete.description')}
        confirmLabel={t('hero.confirm.delete.confirmLabel')}
        isPending={deleteHero.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteHero.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

interface HeroFormSheetProps {
  open: boolean;
  onClose: () => void;
  entity: ApiHeroSection | null;
}

function HeroFormSheet({ open, onClose, entity }: HeroFormSheetProps) {
  const { t } = useTranslation('marketing');
  const { t: tCommon } = useTranslation('common');
  const create = useCreateHeroSection();
  const update = useUpdateHeroSection();
  const isEdit = Boolean(entity);
  const isPending = create.isPending || update.isPending;

  const [smallImage, setSmallImage] = useState(findHeroImageUrl(entity, 'small'));
  const [largeImage, setLargeImage] = useState(findHeroImageUrl(entity, 'large'));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!smallImage || !largeImage) {
      setError(t('hero.form.bothRequired'));
      return;
    }
    const payload: HeroPayload = { smallImageUrl: smallImage, largeImageUrl: largeImage };
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
      title={isEdit ? t('hero.edit') : t('hero.new')}
      description={t('hero.form.description')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? t('hero.form.save') : t('hero.form.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField label={t('hero.form.smallImage')} required error={error && !smallImage ? error : undefined}>
          <AdminImageUploader
            folder="ImageSlider"
            value={smallImage || undefined}
            onChange={setSmallImage}
            onClear={() => setSmallImage('')}
            disabled={isPending}
            aspectRatio="3 / 4"
            hasError={Boolean(error && !smallImage)}
          />
        </AdminFormField>

        <AdminFormField label={t('hero.form.largeImage')} required error={error && !largeImage ? error : undefined}>
          <AdminImageUploader
            folder="ImageSlider"
            value={largeImage || undefined}
            onChange={setLargeImage}
            onClear={() => setLargeImage('')}
            disabled={isPending}
            aspectRatio="16 / 9"
            hasError={Boolean(error && !largeImage)}
          />
        </AdminFormField>
      </form>
    </FormSheet>
  );
}
