/**
 * Donut slice colors for the traffic-sources widget. Drawn from existing design
 * tokens so the chart stays on-palette in both themes. Lives in its own module
 * (not the chart component) so both the chart and the card's custom legend can
 * import the same array without tripping react-refresh's component-only rule.
 */
export const TRAFFIC_SOURCE_COLORS = [
  'var(--color-accent)',
  'var(--color-status-confirmed)',
  'var(--color-status-shipped)',
  'var(--color-status-ordered)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-status-delivered)',
  'var(--color-status-under-review)',
];
