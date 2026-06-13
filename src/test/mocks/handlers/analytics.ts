import { http, HttpResponse } from 'msw';
import type {
  AnalyticsOverviewRow,
  AnalyticsTopPage,
  AnalyticsTrafficSource,
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

export const analyticsHandlers = [
  http.get(`${API}/analytics/overview`, ({ request }) => envelope(overviewRows, request)),
  http.get(`${API}/analytics/top-pages`, ({ request }) => envelope(topPages, request)),
  http.get(`${API}/analytics/traffic-sources`, ({ request }) =>
    envelope(trafficSources, request)
  ),
];
