import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import path from 'path';

const resend = new Resend(env.RESEND_API_KEY || 're_placeholder_key');
const RESEND_FROM = env.RESEND_FROM || 'MedTrackInsight <onboarding@resend.dev>';
const ADMIN_EMAIL = env.ADMIN_EMAIL || 'support@medtrackintel.com';

/**
 * Sends an OTP verification email to the user.
 * Falls back to console logging if Resend is not configured.
 */
export const sendOtpEmail = async (
  email: string,
  otp: string,
  type: 'SIGNUP' | 'PASSWORD_RESET'
): Promise<boolean> => {
  // Always log OTP and write to frontend/public/otp.txt for development testing
  logger.info('\n======================================================');
  logger.info('📬 [DEVELOPMENT OTP LOG SERVICE]');
  logger.info(`   To:       ${email}`);
  logger.info(`   OTP Code: ${otp}`);
  logger.info(`   Type:     ${type}`);
  logger.info('======================================================\n');

  try {
    if (process.env.NODE_ENV !== 'production') {
      const fs = require('fs');
      const otpPath = path.resolve(__dirname, '../../../frontend/public/otp.txt');
      fs.writeFileSync(otpPath, otp);
      logger.info(`[DEVELOPMENT] Saved OTP ${otp} to frontend public/otp.txt`);
    }
  } catch (writeErr) {
    logger.error('Error writing otp.txt:', { error: writeErr });
  }

  const subject =
    type === 'SIGNUP'
      ? 'Verify Your MedTrackInsight Account'
      : 'Reset Your MedTrackInsight Password';

  const messageText =
    type === 'SIGNUP'
      ? `Welcome to MedTrackInsight! Your account verification code is: ${otp}. This code is valid for 10 minutes.`
      : `You requested a password reset for your MedTrackInsight account. Your reset code is: ${otp}. This code is valid for 10 minutes.`;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f3f3f1; color: #000000; border: 1px solid #000000;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em;">MedTrackInsight</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #555555;">Clinical & Molecular R&D Intelligence</span>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #000000; border-radius: 8px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
          ${type === 'SIGNUP' ? 'Email Verification Required' : 'Password Reset Request'}
        </h3>
        
        <p style="font-size: 14px; line-height: 1.6; color: #333333; margin-bottom: 24px;">
          ${type === 'SIGNUP' 
            ? 'Thank you for registering. Please enter the following one-time verification code to activate your account and access the sandbox workspace:' 
            : 'We received a request to change your account password. Please enter the following one-time verification code to proceed:'
          }
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #F3D07B; border: 2px solid #000000; padding: 12px 28px; font-size: 32px; font-weight: 800; letter-spacing: 0.15em; border-radius: 4px;">
            ${otp}
          </div>
        </div>
        
        <p style="font-size: 12px; color: #666666; text-align: center; margin-top: 24px;">
          This code is highly sensitive and will expire in <strong>10 minutes</strong>. If you did not make this request, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #888888;">
        © ${new Date().getFullYear()} MedTrackInsight Portal. All rights reserved.
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_placeholder_key') {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: subject,
        text: messageText,
        html: htmlContent,
      });

      logger.info(`✉️ Email successfully dispatched via Resend to ${email}.`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to dispatch email via Resend:', { error: error });
    }
  } else {
    logger.warn('⚠️ RESEND_API_KEY is not configured. Skipping Resend email dispatch.');
  }

  return true;
};

/**
 * Sends a Contact Us notification email to the administrator.
 */
export const sendContactEmail = async (
  name: string,
  email: string,
  message: string
): Promise<boolean> => {
  // Log message to console for development reference
  logger.info('\n======================================================');
  logger.info('📬 [DEVELOPMENT CONTACT MESSAGE LOG]');
  logger.info(`   From: ${name} <${email}>`);
  logger.info(`   Message: ${message}`);
  logger.info('======================================================\n');

  const subject = `[Contact Us] New Message from ${name}`;
  const messageText = `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0d0d0d; color: #ffffff; border: 1px solid #1a1a1a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222222; padding-bottom: 20px;">
        <h2 style="font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; color: #F3D07B;">MedTrackInsight</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">Clinical & Molecular R&D Intelligence</span>
      </div>
      
      <div style="background-color: #121212; padding: 30px; border: 1px solid #222222; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 24px; color: #F3D07B; border-left: 4px solid #F3D07B; padding-left: 12px;">
          New Contact Submission
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #888888; width: 120px; font-weight: 600; vertical-align: top;">Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; vertical-align: top;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Email Address:</td>
            <td style="padding: 8px 0; vertical-align: top;"><a href="mailto:${email}" style="color: #F3D07B; text-decoration: none; font-weight: 700;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Date Submitted:</td>
            <td style="padding: 8px 0; color: #ffffff; vertical-align: top;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="border-top: 1px solid #222222; padding-top: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888888;">Message Body:</h4>
          <div style="background-color: #0a0a0a; border: 1px solid #222222; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #dddddd; white-space: pre-wrap; font-family: inherit;">${message}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666666; border-top: 1px solid #222222; padding-top: 20px;">
        This email was automatically generated from the MedTrackInsight Contact Us portal.<br>
        © ${new Date().getFullYear()} MedTrackInsight. All rights reserved.
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_placeholder_key') {
    try {
      const fromEmail = RESEND_FROM.includes('<')
        ? RESEND_FROM.split('<')[1].replace('>', '').trim()
        : RESEND_FROM.trim();

      await resend.emails.send({
        from: `"${name} via MedTrackInsight" <${fromEmail}>`,
        to: ADMIN_EMAIL,
        reply_to: email,
        subject: subject,
        text: messageText,
        html: htmlContent,
      });
      logger.info(`✉️ Contact submission notification dispatched to admin via Resend.`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to dispatch contact notification email via Resend:', { error: error });
    }
  } else {
    logger.warn('⚠️ Resend is not configured. Skipping Contact Us notification email.');
  }
  return false;
};

/**
 * Sends a Request Demo notification email to the administrator.
 */
export const sendDemoEmail = async (
  name: string,
  company: string,
  email: string,
  jobTitle: string,
  requirements: string
): Promise<boolean> => {
  // Log request to console for development reference
  logger.info('\n======================================================');
  logger.info('📬 [DEVELOPMENT DEMO REQUEST LOG]');
  logger.info(`   From: ${name} <${email}>`);
  logger.info(`   Company: ${company} (${jobTitle})`);
  logger.info(`   Requirements: ${requirements}`);
  logger.info('======================================================\n');

  const subject = `[Request Demo] New Booking from ${name} at ${company}`;
  const messageText = `Name: ${name}\nJob Title: ${jobTitle}\nCompany: ${company}\nEmail: ${email}\nRequirements:\n${requirements}`;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0d0d0d; color: #ffffff; border: 1px solid #1a1a1a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222222; padding-bottom: 20px;">
        <h2 style="font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; color: #F3D07B;">MedTrackInsight</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">Clinical & Molecular R&D Intelligence</span>
      </div>
      
      <div style="background-color: #121212; padding: 30px; border: 1px solid #222222; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 24px; color: #F3D07B; border-left: 4px solid #F3D07B; padding-left: 12px;">
          New Demo Request Booking
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #888888; width: 140px; font-weight: 600; vertical-align: top;">Prospect Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; vertical-align: top;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Job Title:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; vertical-align: top;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Company Name:</td>
            <td style="padding: 8px 0; color: #F3D07B; font-weight: 800; vertical-align: top; font-size: 15px;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Email Address:</td>
            <td style="padding: 8px 0; vertical-align: top;"><a href="mailto:${email}" style="color: #F3D07B; text-decoration: none; font-weight: 700;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Date Submitted:</td>
            <td style="padding: 8px 0; color: #ffffff; vertical-align: top;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="border-top: 1px solid #222222; padding-top: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888888;">Specific Requirements / Use Case:</h4>
          <div style="background-color: #0a0a0a; border: 1px solid #222222; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #dddddd; white-space: pre-wrap; font-family: inherit;">${requirements || 'No specific requirements provided.'}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666666; border-top: 1px solid #222222; padding-top: 20px;">
        This email was automatically generated from the MedTrackInsight Demo request portal.<br>
        © ${new Date().getFullYear()} MedTrackInsight. All rights reserved.
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_placeholder_key') {
    try {
      const fromEmail = RESEND_FROM.includes('<')
        ? RESEND_FROM.split('<')[1].replace('>', '').trim()
        : RESEND_FROM.trim();

      await resend.emails.send({
        from: `"${name} at ${company}" <${fromEmail}>`,
        to: ADMIN_EMAIL,
        reply_to: email,
        subject: subject,
        text: messageText,
        html: htmlContent,
      });
      logger.info(`✉️ Demo booking notification dispatched to admin via Resend.`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to dispatch demo notification email via Resend:', { error: error });
    }
  } else {
    logger.warn('⚠️ Resend is not configured. Skipping Demo request notification email.');
  }
  return false;
};

/**
 * Sends a Contact Us confirmation email directly to the user.
 */
export const sendContactThankYouEmail = async (
  name: string,
  email: string,
  message: string
): Promise<boolean> => {
  const subject = `Message Received - MedTrackInsight Support`;
  const messageText = `Dear ${name},\n\nThank you for reaching out to MedTrackInsight. We have received your message and our team will get back to you shortly.\n\nSummary of your message:\n"${message}"\n\nBest regards,\nThe MedTrackInsight Team`;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0d0d0d; color: #ffffff; border: 1px solid #1a1a1a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222222; padding-bottom: 20px;">
        <h2 style="font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; color: #F3D07B;">MedTrackInsight</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">Clinical & Molecular R&D Intelligence</span>
      </div>
      
      <div style="background-color: #121212; padding: 30px; border: 1px solid #222222; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 24px; color: #F3D07B; border-left: 4px solid #F3D07B; padding-left: 12px;">
          Thank You for Reaching Out
        </h3>
        
        <p style="font-size: 14px; line-height: 1.6; color: #dddddd; margin-bottom: 24px;">
          Dear <strong>${name}</strong>,<br><br>
          We have successfully received your inquiry. A member of our support team will review your details and reach out to you within the next <strong>24 to 48 hours</strong>.
        </p>

        <div style="border-top: 1px solid #222222; padding-top: 20px; margin-top: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888888;">A Copy of Your Message:</h4>
          <div style="background-color: #0a0a0a; border: 1px solid #222222; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #dddddd; white-space: pre-wrap; font-family: inherit;">${message}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666666; border-top: 1px solid #222222; padding-top: 20px;">
        If you did not initiate this request, please disregard this email.<br>
        © ${new Date().getFullYear()} MedTrackInsight. All rights reserved.
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_placeholder_key') {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: subject,
        text: messageText,
        html: htmlContent,
      });
      logger.info(`✉️ Thank-you email successfully dispatched via Resend to ${email}.`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to dispatch thank-you email to ${email} via Resend:`, { error: error });
    }
  } else {
    logger.warn('⚠️ Resend is not configured. Skipping thank-you email dispatch.');
  }
  return false;
};

/**
 * Sends a Request Demo confirmation email directly to the user.
 */
export const sendDemoThankYouEmail = async (
  name: string,
  company: string,
  email: string,
  jobTitle: string,
  requirements?: string
): Promise<boolean> => {
  const subject = `Demo Walkthrough Request Received - MedTrackInsight`;
  const messageText = `Dear ${name},\n\nThank you for requesting a demo of MedTrackInsight. We have received your request and our clinical intelligence team will contact you shortly to schedule your personalized walkthrough.\n\nSummary of your request details:\nCompany: ${company}\nJob Title: ${jobTitle}\nEmail: ${email}\nRequirements: ${requirements || 'None'}\n\nBest regards,\nThe MedTrackInsight Team`;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0d0d0d; color: #ffffff; border: 1px solid #1a1a1a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222222; padding-bottom: 20px;">
        <h2 style="font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; color: #F3D07B;">MedTrackInsight</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">Clinical & Molecular R&D Intelligence</span>
      </div>
      
      <div style="background-color: #121212; padding: 30px; border: 1px solid #222222; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 24px; color: #F3D07B; border-left: 4px solid #F3D07B; padding-left: 12px;">
          Demo Request Confirmed
        </h3>
        
        <p style="font-size: 14px; line-height: 1.6; color: #dddddd; margin-bottom: 24px;">
          Dear <strong>${name}</strong>,<br><br>
          Thank you for your interest in MedTrackInsight. We have successfully registered your request for a personalized product walkthrough. A clinical systems specialist will contact you shortly at <strong>${email}</strong> to coordinate a date and time.
        </p>

        <h4 style="margin-top: 24px; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888888; border-bottom: 1px solid #222222; padding-bottom: 6px;">Request Details</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #888888; width: 140px; font-weight: 600; vertical-align: top;">Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; vertical-align: top;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Job Title:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; vertical-align: top;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-weight: 600; vertical-align: top;">Company:</td>
            <td style="padding: 8px 0; color: #F3D07B; font-weight: 800; vertical-align: top;">${company}</td>
          </tr>
        </table>

        ${requirements ? `
        <div style="border-top: 1px solid #222222; padding-top: 20px; margin-top: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888888;">Specific Requirements:</h4>
          <div style="background-color: #0a0a0a; border: 1px solid #222222; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #dddddd; white-space: pre-wrap; font-family: inherit;">${requirements}</div>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666666; border-top: 1px solid #222222; padding-top: 20px;">
        This is an automated confirmation of your request.<br>
        © ${new Date().getFullYear()} MedTrackInsight. All rights reserved.
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_placeholder_key') {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: subject,
        text: messageText,
        html: htmlContent,
      });
      logger.info(`✉️ Demo thank-you email successfully dispatched via Resend to ${email}.`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to dispatch demo thank-you email to ${email} via Resend:`, { error: error });
    }
  } else {
    logger.warn('⚠️ Resend is not configured. Skipping demo thank-you email dispatch.');
  }
  return false;
};
