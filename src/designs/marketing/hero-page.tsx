import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiHeroSection | null>(null);
  const [deleting, setDeleting] = useState<ApiHeroSection | null>(null);

  const heroQuery = useHeroSections();
  const deleteHero = useDeleteHeroSection();

  const sheetOpen = creating || editing !== null;

  return (
    <>
      <PageHeader
        title="Hero Slider"
        subtitle="Each slide pairs a small and a large banner. They drive the storefront's homepage."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add slide
          </Button>
        }
      />

      {heroQuery.isPending ? (
        <CardGridSkeleton count={3} />
      ) : heroQuery.isError ? (
        <QueryErrorState error={heroQuery.error} onRetry={() => heroQuery.refetch()} />
      ) : !heroQuery.data || heroQuery.data.length === 0 ? (
        <EmptyState
          title="Homepage hero is empty"
          description="Without a slide the storefront's homepage will load with a blank banner. Add one to bring it back."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} strokeWidth={1.5} aria-hidden />
              Add first slide
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
                    alt="Small banner"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={findHeroImageUrl(hero, 'large')}
                    alt="Large banner"
                    loading="lazy"
                    decoding="async"
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(hero)}>
                  <Pencil size={14} strokeWidth={1.5} aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(hero)}
                  aria-label="Delete hero slide"
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
        title="Delete this hero slide?"
        description="It will disappear from the storefront hero immediately."
        confirmLabel="Delete slide"
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
      setError('Both images are required.');
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
      title={isEdit ? 'Edit hero slide' : 'New hero slide'}
      description="Upload one small and one large image. Both go live together."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save slide' : 'Create slide'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormField label="Small image" required error={error && !smallImage ? error : undefined}>
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

        <AdminFormField label="Large image" required error={error && !largeImage ? error : undefined}>
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
