import { http, HttpResponse } from 'msw';
import type { ApiCategoryIcon } from '@/shared/types/api';

const API = 'https://api.test.local';

const seed: ApiCategoryIcon[] = [
  {
    _id: 'icon-1',
    key: 'bras',
    svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'icon-2',
    key: 'panties',
    svg: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="currentColor"/></svg>',
    isActive: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

const store = new Map<string, ApiCategoryIcon>(seed.map((i) => [i.key, i]));

export const iconsHandlers = [
  http.get(`${API}/icons`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { icons: Array.from(store.values()) },
      message: 'OK',
      success: true,
    })
  ),

  http.get(`${API}/icons/:key`, ({ params }) => {
    const icon = store.get(String(params.key));
    if (!icon) {
      return HttpResponse.json(
        { success: false, message: 'Category icon not found', error: [] },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: { icon },
      message: 'OK',
      success: true,
    });
  }),

  http.post(`${API}/icons`, async ({ request }) => {
    const body = (await request.json()) as Partial<ApiCategoryIcon>;
    const key = String(body.key ?? '');
    if (store.has(key)) {
      return HttpResponse.json(
        { success: false, message: 'An icon with this key already exists', error: [] },
        { status: 409 }
      );
    }
    const created: ApiCategoryIcon = {
      _id: `icon-${Date.now()}`,
      key,
      svg: String(body.svg ?? ''),
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    store.set(created.key, created);
    return HttpResponse.json(
      {
        statusCode: 201,
        data: { icon: created },
        message: 'Category icon created successfully',
        success: true,
      },
      { status: 201 }
    );
  }),

  http.put(`${API}/icons/:key`, async ({ params, request }) => {
    const key = String(params.key);
    const existing = store.get(key);
    if (!existing) {
      return HttpResponse.json(
        { success: false, message: 'Category icon not found', error: [] },
        { status: 404 }
      );
    }
    const body = (await request.json()) as Partial<ApiCategoryIcon>;
    const updated: ApiCategoryIcon = {
      ...existing,
      svg: body.svg ?? existing.svg,
      isActive: body.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString(),
    };
    store.set(key, updated);
    return HttpResponse.json({
      statusCode: 200,
      data: { icon: updated },
      message: 'Category icon updated successfully',
      success: true,
    });
  }),

  http.delete(`${API}/icons/:key`, ({ params }) => {
    const key = String(params.key);
    if (!store.delete(key)) {
      return HttpResponse.json(
        { success: false, message: 'Category icon not found', error: [] },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: null,
      message: 'Category icon deleted successfully',
      success: true,
    });
  }),
];
