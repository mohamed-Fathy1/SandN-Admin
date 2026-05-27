import { http, HttpResponse } from 'msw';

const API = 'https://api.test.local';

export const wishlistHandlers = [
  http.get(`${API}/wishlist`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    return HttpResponse.json({
      statusCode: 200,
      data: {
        wishlist: {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          products: [],
        },
      },
      message: 'wishlist found successfully',
      success: true,
    });
  }),
];
