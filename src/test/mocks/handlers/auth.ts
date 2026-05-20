import { http, HttpResponse } from 'msw';

const API = 'https://api.test.local';

export const authHandlers = [
  http.post(`${API}/authentication/register-email`, () =>
    HttpResponse.json({ statusCode: 200, data: null, message: 'Code sent', success: true })
  ),
  http.post(`${API}/authentication/active-account`, async ({ request }) => {
    const body = (await request.json()) as { email: string; activeCode: string };
    if (body.activeCode === '000000') {
      return HttpResponse.json(
        {
          statusCode: 400,
          message: 'Code is incorrect',
          errors: [],
          success: false,
        },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: { accessToken: 'test-token-abc' },
      message: 'OK',
      success: true,
    });
  }),
  http.post(`${API}/authentication/email-new-code`, () =>
    HttpResponse.json({ statusCode: 200, data: null, message: 'Code sent', success: true })
  ),
];
