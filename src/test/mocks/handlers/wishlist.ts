import { http, HttpResponse } from 'msw';

const API = 'https://api.test.local';

export const wishlistHandlers = [
  http.get(`${API}/wishlist`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { wishlistItems: [], currentPage: 1, totalPages: 1 },
      message: 'OK',
      success: true,
    })
  ),
];
