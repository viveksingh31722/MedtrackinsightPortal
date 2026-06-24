import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '';

console.log('Env variables loaded:');
console.log('Host:', SMTP_HOST);
console.log('Port:', SMTP_PORT);
console.log('User:', SMTP_USER);
console.log('Pass length:', SMTP_PASS.length);
console.log('From:', SMTP_FROM);

const run = async () => {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    debug: true,
    logger: true,
  });

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: 'singh17rrishu@gmail.com',
      subject: 'Test Email from MedTrackInsight',
      text: 'This is a test email sent from the test script.',
    });
    console.log('Email sent successfully!');
    console.log('Response info:', info);
  } catch (error) {
    console.error('Error occurred:', error);
  }
};

run();
