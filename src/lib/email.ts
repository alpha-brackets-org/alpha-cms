import nodemailer from 'nodemailer';

/**
 * ALPHA HUB EMAIL ENGINE
 * Integrated with Mailtrap for development/staging.
 */

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT || '2525'),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const FROM_EMAIL = '"Alpha CMS Infrastructure" <no-reply@alphabrackets.com>';

export async function sendOperatorInvite(
  email: string,
  role: string,
  temporaryPassword: string
) {
  // Fallback for development if credentials are not set
  if (!process.env.MAIL_USER || process.env.MAIL_USER === 'your_user') {
    console.warn(
      '⚠️ [EMAIL ENGINE] SMTP Credentials not configured. Invitation logged to console.'
    );
    console.log(`
      [DEV INVITE LOG]
      To: ${email}
      Role: ${role}
      Temporary Key: ${temporaryPassword}
    `);
    return { success: true, logged: true };
  }

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: 'AUTHORIZATION GRANTED - ALPHA CMS',
    html: `
      <div style="font-family: monospace; background: #000; color: #fff; padding: 40px; border: 4px solid #fff;">
        <h1 style="color: #00ff00; text-transform: uppercase;">Authorization Granted</h1>
        <hr style="border: 2px solid #fff;" />
        <p>YOU HAVE BEEN AUTHORIZED AS AN [${role.toUpperCase()}] IN THE ALPHA CMS.</p>
        <div style="background: #111; padding: 20px; border: 2px solid #333; margin: 20px 0;">
          <p><strong>IDENTITY:</strong> ${email}</p>
          <p><strong>ACCESS KEY:</strong> ${temporaryPassword}</p>
        </div>
        <p>LINK: <a href="http://localhost:3001/login" style="color: #00ff00;">INITIATE SESSION</a></p>
        <hr style="border: 1px solid #333;" />
        <p style="font-size: 10px; color: #666;">UNAUTHORIZED ACCESS IS PROHIBITED. ENCRYPTION ACTIVE.</p>
      </div>
    `,
  });

  console.log('Invite transmitted:', info.messageId);
  return { success: true };
}

export async function sendPasswordReset(email: string, resetToken: string) {
  // Fallback for development if credentials are not set
  if (!process.env.MAIL_USER || process.env.MAIL_USER === 'your_user') {
    console.warn(
      '⚠️ [EMAIL ENGINE] SMTP Credentials not configured. Reset link logged to console.'
    );
    console.log(`
      [DEV RESET LOG]
      To: ${email}
      Link: http://localhost:3001/reset-password?token=${resetToken}
    `);
    return { success: true, logged: true };
  }

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: 'SECURITY PROTOCOL - PASSWORD RESTORE',
    html: `
      <div style="font-family: monospace; background: #000; color: #fff; padding: 40px; border: 4px solid #fff;">
        <h1 style="color: #ff0000; text-transform: uppercase;">Security Protocol</h1>
        <hr style="border: 2px solid #fff;" />
        <p>A PASSWORD RESET WAS REQUESTED FOR YOUR ALPHA CMS ACCOUNT.</p>
        <div style="margin: 20px 0;">
          <a href="http://localhost:3001/reset-password?token=${resetToken}" 
             style="display: inline-block; background: #fff; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold;">
            RESTORE ACCESS
          </a>
        </div>
        <p>IF YOU DID NOT REQUEST THIS, CONTACT THE SYSTEM ADMINISTRATOR IMMEDIATELY.</p>
        <hr style="border: 1px solid #333;" />
        <p style="font-size: 10px; color: #666;">SECURITY ALERT: DO NOT SHARE THIS LINK.</p>
      </div>
    `,
  });

  console.log('Reset link transmitted:', info.messageId);
  return { success: true };
}
