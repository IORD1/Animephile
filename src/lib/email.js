import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    ...(text && { text }),
    ...(html && { html }),
  });
}
