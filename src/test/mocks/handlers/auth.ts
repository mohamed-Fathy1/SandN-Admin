import { http, HttpResponse } from 'msw';

const API = 'https://api.test.local';

export const authHandlers = [
  http.post(`${API}/authentication/register-email`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    // Mimic the spec's three-way response: admin emails get the data payload,
    // anything else gets data: null so the UI can tell whether to navigate to /verify.
    if (body.email === 'admin@example.com') {
      return HttpResponse.json({
        statusCode: 200,
        data: { email: body.email },
        message: 'email sent successfully',
        success: true,
      });
    }
    return HttpResponse.json({
      statusCode: 200,
      data: null,
      message: 'Welcome email sent successfully',
      success: true,
    });
  }),
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
