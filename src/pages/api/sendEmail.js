import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'animephileupdates@gmail.com',
      pass: 'kpappwgawkrrmbwp',
    },
});
  

export default async function handler(req, res) {
    try {
        const { recipientEmail, subject } = req.body;

        const mailOptions = {
            from: 'animephileupdates@gmail.com',
            to: recipientEmail,
            subject: subject
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
}
