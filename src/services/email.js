const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Email OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FUDO Verification Code</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f6f6f6; color: #1f2937; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f6f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #f6f6f6; padding: 0 24px;">
              <!-- Logo Section -->
              <tr>
                <td align="left" style="padding-bottom: 6px;">
                  <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.15em; color: #111827; text-decoration: none;">FUDO<span style="display: inline-block; width: 6px; height: 6px; background-color: #D62828; border-radius: 50%; margin-left: 2px;"></span></span>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-bottom: 32px;">
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Lifting Club</span>
                </td>
              </tr>
              <!-- Card Section -->
              <tr>
                <td style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="font-size: 20px; font-weight: 700; color: #111827; padding-bottom: 8px;">Your Verification Code</td>
                    </tr>
                    <tr>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.6; padding-bottom: 24px;">Use this OTP to sign in to your FUDO account. It's valid for 5 minutes.</td>
                    </tr>
                    <tr>
                      <td style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; text-align: center;">
                        <div style="font-size: 38px; font-weight: 800; letter-spacing: 0.25em; color: #D62828; font-family: monospace; line-height: 1;">${otp}</div>
                        <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 10px; font-weight: 500;">One-Time Password</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="color: #9ca3af; font-size: 12px; padding-top: 20px;">⏰ Expires in 5 minutes. Do not share this code.</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td align="center" style="padding-top: 32px; border-top: 1px solid #e5e7eb; margin-top: 32px;">
                  <span style="color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
                    <strong style="color: #D62828; font-weight: 600;">STRENGTH</strong> &middot; <strong style="color: #D62828; font-weight: 600;">DISCIPLINE</strong> &middot; <strong style="color: #D62828; font-weight: 600;">COMMUNITY</strong><br><br>
                    &copy; ${new Date().getFullYear()} FUDO Lifting Club. If you didn't request this, ignore this email.
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"FUDO Lifting Club" <noreply@fudo.club>',
    to: email,
    subject: `${otp} — Your FUDO Verification Code`,
    html,
  });

  console.log(`[Email] OTP sent to ${email}`);
};

const sendRegistrationConfirmationEmail = async (email, user, session, qrDataURL) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Registration confirmation email for ${email} (session: ${session.title})`);
    return;
  }

  const transporter = createTransporter();
  const dateStr = new Date(session.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FUDO Registration Confirmed</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f6f6f6; color: #1f2937; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f6f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #f6f6f6; padding: 0 24px;">
              <!-- Logo Section -->
              <tr>
                <td align="left" style="padding-bottom: 6px;">
                  <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.15em; color: #111827; text-decoration: none;">FUDO<span style="display: inline-block; width: 6px; height: 6px; background-color: #D62828; border-radius: 50%; margin-left: 2px;"></span></span>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-bottom: 32px;">
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Lifting Club</span>
                </td>
              </tr>
              <!-- Card Section -->
              <tr>
                <td style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="font-size: 20px; font-weight: 700; color: #111827; padding-bottom: 8px;">Registration Confirmed!</td>
                    </tr>
                    <tr>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.6; padding-bottom: 24px;">Hi ${user.name || 'Member'}, your spot is locked! Present the QR code below at the venue entrance.</td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <img src="cid:registration_qr" alt="QR Code" width="200" height="200" style="display: block; width: 200px; height: 200px; border: 1px solid #e5e7eb; border-radius: 12px;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">${session.title}</div>
                        <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">📅 ${dateStr}</div>
                        <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">🕐 ${session.start_time} - ${session.end_time}</div>
                        <div style="font-size: 13px; color: #4b5563;">📍 ${session.venue}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td align="center" style="padding-top: 32px; border-top: 1px solid #e5e7eb; margin-top: 32px;">
                  <span style="color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
                    <strong style="color: #D62828; font-weight: 600;">STRENGTH</strong> &middot; <strong style="color: #D62828; font-weight: 600;">DISCIPLINE</strong> &middot; <strong style="color: #D62828; font-weight: 600;">COMMUNITY</strong><br><br>
                    &copy; ${new Date().getFullYear()} FUDO Lifting Club. If you didn't request this, ignore this email.
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"FUDO Lifting Club" <noreply@fudo.club>',
    to: email,
    subject: `Registration Confirmed: ${session.title} 🔴`,
    html,
    attachments: [
      {
        filename: 'qr.png',
        content: qrDataURL.split('base64,')[1],
        encoding: 'base64',
        cid: 'registration_qr',
      },
    ],
  });

  console.log(`[Email] Registration QR email sent to ${email}`);
};

const sendBadmintonRegistrationEmail = async (email, user, session) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Badminton registration email for ${email} (session: ${session.title})`);
    return;
  }

  const transporter = createTransporter();
  const dateStr = new Date(session.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FUDO Badminton Registration</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f6f6f6; color: #1f2937; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f6f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #f6f6f6; padding: 0 24px;">
              <!-- Logo Section -->
              <tr>
                <td align="left" style="padding-bottom: 6px;">
                  <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.15em; color: #111827; text-decoration: none;">FUDO<span style="display: inline-block; width: 6px; height: 6px; background-color: #D62828; border-radius: 50%; margin-left: 2px;"></span></span>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-bottom: 32px;">
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Lifting Club</span>
                </td>
              </tr>
              <!-- Card Section -->
              <tr>
                <td style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="font-size: 20px; font-weight: 700; color: #111827; padding-bottom: 8px;">Registration Received!</td>
                    </tr>
                    <tr>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.6; padding-bottom: 24px;">Hi ${user.name || 'Member'}, we have received your registration for the badminton session. Since this session requires coordination, a FUDO representative will contact you shortly via WhatsApp/Phone to share final payment and venue details.</td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">${session.title}</div>
                        <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">📅 ${dateStr}</div>
                        <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">🕐 ${session.start_time} - ${session.end_time}</div>
                        <div style="font-size: 13px; color: #4b5563;">📍 ${session.venue}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td align="center" style="padding-top: 32px; border-top: 1px solid #e5e7eb; margin-top: 32px;">
                  <span style="color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
                    <strong style="color: #D62828; font-weight: 600;">STRENGTH</strong> &middot; <strong style="color: #D62828; font-weight: 600;">DISCIPLINE</strong> &middot; <strong style="color: #D62828; font-weight: 600;">COMMUNITY</strong><br><br>
                    &copy; ${new Date().getFullYear()} FUDO Lifting Club. If you didn't request this, ignore this email.
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"FUDO Lifting Club" <noreply@fudo.club>',
    to: email,
    subject: `Badminton Registration: ${session.title} 🏸`,
    html,
  });

  console.log(`[Email] Badminton registration confirmation email sent to ${email}`);
};

module.exports = { sendOTPEmail, sendRegistrationConfirmationEmail, sendBadmintonRegistrationEmail };
