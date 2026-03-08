import * as Brevo from '@getbrevo/brevo';

const client = new Brevo.TransactionalEmailsApi();
client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

/**
 * Sends a transactional email via Brevo.
 * @param {{ to: string, toName: string, subject: string, html: string }} options
 */
async function sendEmail({ to, toName, subject, html }) {
  const email = new Brevo.SendSmtpEmail();

  email.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || 'DevHive',
  };
  email.to = [{ email: to, name: toName }];
  email.subject = subject;
  email.htmlContent = html;

  try {
    const result = await client.sendTransacEmail(email);
    console.log('[email] sent successfully:', result);
  } catch (err) {
    console.error('[email] full error:', JSON.stringify(err, null, 2));
    throw err;
  }
}

/**
 * Sends an email verification link to a newly registered user.
 * @param {{ to: string, toName: string, token: string }} options
 */
export async function sendVerificationEmail({ to, toName, token }) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await sendEmail({
    to,
    toName,
    subject: 'Verify your DevHive email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to DevHive, ${toName}</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyUrl}"
          style="display: inline-block; padding: 12px 24px; background: #1e293b;
                 color: white; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          This link expires in 24 hours. If you did not create a DevHive account, ignore this email.
        </p>
      </div>
    `,
  });
}  