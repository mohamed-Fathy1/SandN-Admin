import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/designs/layout/page-header';
import { Card } from '@/designs/shared/card';

function DashboardPlaceholder() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Phase 8 will wire the KPI widgets here."
      />
      <Card elevation="sm" padding="lg">
        <p className="m-0 text-sm text-muted-foreground">
          The dashboard is the last piece built in Phase 8. The shell, auth, and route guard are in
          place — every other phase plugs feature pages into this layout.
        </p>
      </Card>
    </>
  );
}

export const Route = createFileRoute('/_protected/')({
  component: DashboardPlaceholder,
});
