import { http, HttpResponse } from 'msw';
import type {
  AnalyticsOverviewRow,
  AnalyticsTopPage,
  AnalyticsTrafficSource,
  ClarityInsights,
  ClarityMetric,
} from '@/shared/types/api';

const API = 'https://api.test.local';

const overviewRows: AnalyticsOverviewRow[] = [
  {
    date: '2026-06-12',
    activeUsers: 5,
    sessions: 6,
    screenPageViews: 18,
    newUsers: 4,
    averageSessionDuration: 92.5,
  },
  {
    date: '2026-06-13',
    activeUsers: 3,
    sessions: 3,
    screenPageViews: 9,
    newUsers: 3,
    averageSessionDuration: 116.12697166666668,
  },
];

const topPages: AnalyticsTopPage[] = [
  { pagePath: '/', screenPageViews: 5 },
  { pagePath: '/products/6a2213c7b29fc873ee9f67f3', screenPageViews: 4 },
];

const trafficSources: AnalyticsTrafficSource[] = [
  { source: '(direct)', sessions: 3 },
  { source: '(not set)', sessions: 2 },
];

function envelope<T>(rows: T[], request: Request) {
  const url = new URL(request.url);
  return HttpResponse.json({
    statusCode: 200,
    data: {
      startDate: url.searchParams.get('startDate') ?? '7daysAgo',
      endDate: url.searchParams.get('endDate') ?? 'today',
      rows,
    },
    message: 'Success',
    success: true,
  });
}

// ─────────────────────────── Clarity behavioural ───────────────────────────

/** Base metric blocks — numbers arrive as strings, matching the live API. */
function clarityMetrics(dimension1: string | null): ClarityMetric[] {
  const metrics: ClarityMetric[] = [
    {
      metricName: 'Traffic',
      information: [
        {
          totalSessionCount: '128',
          totalBotSessionCount: '12',
          distinctUserCount: '96',
          pagesPerSessionPercentage: '3.4',
        },
      ],
    },
    { metricName: 'ScrollDepth', information: [{ averageScrollDepth: '62.5' }] },
    { metricName: 'EngagementTime', information: [{ totalTime: '540', activeTime: '186' }] },
    {
      metricName: 'DeadClickCount',
      information: [
        {
          sessionsCount: '9',
          sessionsWithMetricPercentage: 7,
          sessionsWithoutMetricPercentage: 93,
          pagesViews: '20',
          subTotal: '11',
        },
      ],
    },
    {
      metricName: 'RageClickCount',
      information: [
        {
          sessionsCount: '3',
          sessionsWithMetricPercentage: 2.3,
          sessionsWithoutMetricPercentage: 97.7,
          pagesViews: '5',
          subTotal: '4',
        },
      ],
    },
    {
      metricName: 'QuickbackClick',
      information: [
        {
          sessionsCount: '5',
          sessionsWithMetricPercentage: 3.9,
          sessionsWithoutMetricPercentage: 96.1,
          pagesViews: '5',
          subTotal: '5',
        },
      ],
    },
    {
      metricName: 'ExcessiveScroll',
      information: [
        {
          sessionsCount: '0',
          sessionsWithMetricPercentage: 0,
          sessionsWithoutMetricPercentage: 100,
          pagesViews: '0',
          subTotal: '0',
        },
      ],
    },
    {
      metricName: 'ScriptErrorCount',
      information: [
        {
          sessionsCount: '2',
          sessionsWithMetricPercentage: 1.5,
          sessionsWithoutMetricPercentage: 98.5,
          pagesViews: '4',
          subTotal: '2',
        },
      ],
    },
    {
      metricName: 'ErrorClickCount',
      information: [
        {
          sessionsCount: '1',
          sessionsWithMetricPercentage: 0.8,
          sessionsWithoutMetricPercentage: 99.2,
          pagesViews: '1',
          subTotal: '1',
        },
      ],
    },
  ];

  if (dimension1) {
    metrics.push({
      metricName: dimension1,
      information: [
        { name: 'Chrome', sessionsCount: '74' },
        { name: 'Safari', sessionsCount: '38' },
        { name: 'Edge', sessionsCount: '16' },
      ],
    });
  }

  return metrics;
}

function clarityPayload(request: Request): ClarityInsights {
  const url = new URL(request.url);
  const dimension1 = url.searchParams.get('dimension1');
  const refresh = url.searchParams.get('refresh') === 'true';
  return {
    dimension1,
    fetchedAt: '2026-07-09T12:00:00.000Z',
    fromCache: !refresh,
    stale: false,
    liveCallsToday: refresh ? 2 : 1,
    remainingLiveCalls: refresh ? 8 : 9,
    note: null,
    metrics: clarityMetrics(dimension1),
  };
}

export const analyticsHandlers = [
  http.get(`${API}/analytics/overview`, ({ request }) => envelope(overviewRows, request)),
  http.get(`${API}/analytics/top-pages`, ({ request }) => envelope(topPages, request)),
  http.get(`${API}/analytics/traffic-sources`, ({ request }) =>
    envelope(trafficSources, request)
  ),
  http.get(`${API}/analytics/clarity`, ({ request }) =>
    HttpResponse.json({
      statusCode: 200,
      data: clarityPayload(request),
      message: 'Success',
      success: true,
    })
  ),
];
