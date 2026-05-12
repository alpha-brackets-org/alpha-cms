import nodemailer from 'nodemailer';
import { Blog, CaseStudy, Portfolio, ContentType } from '@/schemas/cms';
import { decrypt } from '@/lib/encryption';
import { getSignedUrl } from '@/lib/imagekit';

/**
 * DYNAMIC TRANSPORTER HELPER
 * Creates a transporter based on portfolio configuration or system default.
 */
function getTransporter(portfolio: Portfolio) {
  const smtp = portfolio.smtpConfig;

  // If portfolio has custom SMTP, use it
  if (smtp?.host && smtp?.user && smtp?.pass) {
    return nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 587,
      secure: smtp.secure || false,
      auth: {
        user: smtp.user,
        pass: decrypt(smtp.pass), // Decrypt for nodemailer
      },
    });
  }

  // Fallback to system environment variables
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT || '2525'),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

interface NewsletterEmailProps {
  to: string;
  portfolio: Portfolio;
  content: Blog | CaseStudy;
  contentType: ContentType;
}

/**
 * ALPHA CMS NEWSLETTER ENGINE
 * Sends branded emails based on portfolio configuration.
 */
export async function sendNewsletterEmail({
  to,
  portfolio,
  content,
  contentType,
}: NewsletterEmailProps) {
  const config = portfolio.newsletterConfig;
  if (!config)
    throw new Error(
      `Portfolio ${portfolio.name} has no newsletter configuration.`
    );

  const senderName = config.senderName;
  if (!senderName)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender name configured.`
    );

  const accentColor = config.accentColor;
  if (!accentColor)
    throw new Error(
      `Portfolio ${portfolio.name} has no accent color configured.`
    );

  const footerText = config.footerText;
  if (!footerText)
    throw new Error(
      `Portfolio ${portfolio.name} has no footer text configured.`
    );

  const logoUrl = config.logoUrl;

  const title =
    contentType === ContentType.BLOG
      ? (content as Blog).title
      : (content as CaseStudy).projectTitle;

  const excerpt = content.excerpt || '';
  const slug = content.slug;
  const imageUrl =
    contentType === ContentType.BLOG
      ? (content as Blog).seo?.ogImage
      : (content as CaseStudy).coverImage;

  // Construct URLs
  if (!portfolio.domain) {
    throw new Error(
      `Cannot send email: Portfolio ${portfolio.name} has no domain configured.`
    );
  }
  const baseUrl = `https://${portfolio.domain}`;

  const contentUrl = `${baseUrl}/${contentType === ContentType.BLOG ? 'blog' : 'case-study'}/${slug}`;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?e=${encodeURIComponent(to)}&p=${portfolio._id}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; color: #333;">
      <div style="background: #000; padding: 30px; text-align: center;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${portfolio.name}" style="max-height: 60px;">`
            : `<h1 style="color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 2px;">${portfolio.name}</h1>`
        }
      </div>
      <div style="padding: 40px; background: #fff;">
        <span style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: ${accentColor}; letter-spacing: 1px;">
          New ${contentType === ContentType.BLOG ? 'Article' : 'Case Study'}
        </span>
        <h2 style="font-size: 24px; margin: 10px 0 20px 0; line-height: 1.2;">${title}</h2>
        ${
          imageUrl
            ? `<div style="margin-bottom: 25px;"><img src="${imageUrl}" alt="${title}" style="width: 100%; border-radius: 4px; border: 2px solid #000; box-shadow: 4px 4px 0px 0px #000;"></div>`
            : ''
        }
        <p style="color: #666; line-height: 1.6; font-size: 16px;">${excerpt}</p>
        <div style="margin: 40px 0;">
          <a href="${contentUrl}" style="display: inline-block; background: ${accentColor}; color: #000; padding: 15px 35px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 14px;">
            Read the full story
          </a>
        </div>
      </div>
      <div style="background: #f4f4f4; padding: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
        <p style="margin-bottom: 10px;">${footerText}</p>
        <p>
          <a href="${unsubscribeUrl}" style="color: #888; text-decoration: underline;">Unsubscribe</a>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p>&copy; ${new Date().getFullYear()} ${portfolio.name} via Alpha CMS Infrastructure</p>
      </div>
    </div>
  `;

  if (!config.senderEmail)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender email configured.`
    );
  const fromAddress = config.senderEmail;

  if (!config.replyTo)
    throw new Error(
      `Portfolio ${portfolio.name} has no replyTo email configured.`
    );
  const replyTo = config.replyTo;

  const transporter = getTransporter(portfolio);

  return await transporter.sendMail({
    from: `"${senderName}" <${fromAddress}>`,
    replyTo,
    to,
    subject: `[${portfolio.name}] New ${contentType === ContentType.BLOG ? 'Post' : 'Project'}: ${title}`,
    html,
  });
}

/**
 * ALPHA CMS LEAD MAGNET ENGINE
 * Sends direct content delivery emails for gated case studies.
 */
export async function sendLeadMagnetEmail({
  to,
  portfolio,
  content,
  intent,
}: {
  to: string;
  portfolio: Portfolio;
  content: CaseStudy;
  intent?: string;
}) {
  const config = portfolio.newsletterConfig;
  if (!config)
    throw new Error(
      `Portfolio ${portfolio.name} has no newsletter configuration.`
    );

  const senderName = config.senderName;
  if (!senderName)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender name configured.`
    );

  const accentColor = config.accentColor;
  if (!accentColor)
    throw new Error(
      `Portfolio ${portfolio.name} has no accent color configured.`
    );

  const logoUrl = config.logoUrl;

  const title = content.projectTitle;
  const downloadUrl = content.pdfUrl
    ? getSignedUrl(content.pdfUrl, 900)
    : `https://${portfolio.domain}/case-study/${content.slug}`;

  const unsubscribeUrl = `https://${portfolio.domain}/unsubscribe?e=${encodeURIComponent(to)}&p=${portfolio._id}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; color: #333;">
      <div style="background: #000; padding: 30px; text-align: center;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${portfolio.name}" style="max-height: 60px;">`
            : `<h1 style="color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 2px;">${portfolio.name}</h1>`
        }
      </div>
      <div style="padding: 40px; background: #fff;">
        <h2 style="font-size: 24px; margin: 0 0 20px 0; line-height: 1.2;">Your Requested Case Study</h2>
        ${
          content.coverImage
            ? `<div style="margin-bottom: 25px;"><img src="${content.coverImage}" alt="${title}" style="width: 100%; border-radius: 4px; border: 2px solid #000; box-shadow: 4px 4px 0px 0px #000;"></div>`
            : ''
        }
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Hi there,
        </p>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Thank you for your interest in our work. As requested, here is the full breakdown of the <strong>${title}</strong> project.
        </p>
        ${
          intent
            ? `<div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid ${accentColor}; font-style: italic; color: #555;">
                "Reason for download: ${intent}"
              </div>`
            : ''
        }
        <div style="margin: 40px 0; text-align: center;">
          <a href="${downloadUrl}" style="display: inline-block; background: ${accentColor}; color: #000; padding: 18px 40px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 15px; border: 2px solid #000; box-shadow: 4px 4px 0px 0px #000;">
            ${content.pdfUrl ? 'Download Case Study PDF' : 'Access Full Case Study'}
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Our team is available to discuss how we can apply similar strategies to your specific challenges. Feel free to reply to this email to start a conversation.
        </p>
      </div>
      <div style="background: #f4f4f4; padding: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
        <p>You are receiving this because you requested a case study from ${portfolio.name}.</p>
        <p>
          <a href="${unsubscribeUrl}" style="color: #888; text-decoration: underline;">Unsubscribe from future updates</a>
        </p>
        <p>&copy; ${new Date().getFullYear()} ${portfolio.name} via Alpha CMS Infrastructure</p>
      </div>
    </div>
  `;

  if (!config.senderEmail)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender email configured.`
    );
  const fromAddress = config.senderEmail;

  if (!config.replyTo)
    throw new Error(
      `Portfolio ${portfolio.name} has no replyTo email configured.`
    );
  const replyTo = config.replyTo;

  const transporter = getTransporter(portfolio);

  return await transporter.sendMail({
    from: `"${senderName}" <${fromAddress}>`,
    replyTo,
    to,
    subject: `[Access Granted] ${title} - Case Study`,
    html,
  });
}
/**
 * SEND MANUAL CAMPAIGN
 * Sends a manual broadcast to all subscribers of a portfolio.
 */
export async function sendCampaignEmail({
  portfolio,
  subject,
  content,
  subscribers,
}: {
  portfolio: Portfolio;
  subject: string;
  content: string; // HTML content from editor
  subscribers: string[]; // List of emails
}) {
  const transporter = getTransporter(portfolio);
  const config = portfolio.newsletterConfig;
  if (!config)
    throw new Error(
      `Portfolio ${portfolio.name} has no newsletter configuration.`
    );

  const accentColor = config.accentColor;
  if (!accentColor)
    throw new Error(
      `Portfolio ${portfolio.name} has no accent color configured.`
    );

  const logoUrl = config.logoUrl;

  const senderName = config.senderName;
  if (!senderName)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender name configured.`
    );

  const senderEmail = config.senderEmail;
  if (!senderEmail)
    throw new Error(
      `Portfolio ${portfolio.name} has no sender email configured.`
    );

  if (!senderEmail) throw new Error('No sender email configured for portfolio');

  // For a production system, we would use a queue.
  // For now, we'll loop (not ideal for thousands of users but fine for initial launch)
  const results = await Promise.allSettled(
    subscribers.map((to) => {
      const unsubscribeUrl = `https://${portfolio.domain}/unsubscribe?e=${encodeURIComponent(to)}&p=${portfolio._id}`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 40px auto; background: #fff; border: 4px solid #000; box-shadow: 10px 10px 0px 0px ${accentColor}; }
              .header { padding: 40px; text-align: center; border-bottom: 4px solid #000; background: ${accentColor}15; }
              .content { padding: 40px; }
              .footer { padding: 30px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
              .content img { max-width: 100%; border: 2px solid #000; margin: 20px 0; }
              .content h1, .content h2, .content h3 { color: #000; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                ${
                  logoUrl
                    ? `<img src="${logoUrl}" alt="${portfolio.name}" style="height: 40px;">`
                    : `<h1 style="margin: 0; font-size: 24px; letter-spacing: -1px; color: ${accentColor};">${portfolio.name}</h1>`
                }
              </div>
              <div class="content">
                ${content}
              </div>
              <div class="footer">
                <p>${portfolio.newsletterConfig?.footerText || 'You are receiving this because you subscribed to our newsletter.'}</p>
                <p style="margin-top: 10px;">
                  <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                </p>
                <p>&copy; ${new Date().getFullYear()} ${portfolio.name}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      return transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        html,
      });
    })
  );

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}
