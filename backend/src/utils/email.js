import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn('[email] SMTP env vars not fully configured. Emails will be skipped.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) return;

  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: html || text
    });
  } catch (err) {
    console.error('[email] Failed to send email:', err.message);
  }
}

