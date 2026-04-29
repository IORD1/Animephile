import { sendEmail } from '@/lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { recipientEmail, subject } = req.body;
    if (!recipientEmail || !subject) {
      return res.status(400).json({ message: 'recipientEmail and subject are required' });
    }
    await sendEmail({ to: recipientEmail, subject });
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
}
