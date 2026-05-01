const https = require('https');

function sendEmailWithResend({ from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      resolve({ skipped: true, reason: 'RESEND_API_KEY is not configured' });
      return;
    }

    const payload = JSON.stringify({
      from,
      to,
      subject,
      html,
    });

    const request = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (error) {
              resolve({});
            }
            return;
          }

          reject(
            new Error(
              `Resend email request failed with status ${response.statusCode}: ${body}`
            )
          );
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

module.exports = {
  sendEmailWithResend,
};
