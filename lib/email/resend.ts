// lib/email/resend.ts
import { Resend } from "resend";
import * as Errors from '@/lib/errors'

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Rahvana <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: Errors.msg(Errors.E.EMAIL_SEND_FAILED) };
  }
}

const LOGO_IMAGE = `
  <img 
    src="${process.env.NEXT_PUBLIC_APP_URL}/assets/images/RahvanaLogo.png"
    alt="Rahvana Logo" 
    style="width:120px; height:auto;" 
  />
`;

export function getEmailConfirmationHtml(confirmLink: string): string {
  // Create a more user-friendly display link
  const displayLink = confirmLink.replace(/^https?:\/\/[^\/]+/, "");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm Your Email</title>
  </head>
  <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">
            
            <!-- Top Accent Bar -->
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">

                <!-- Logo -->
                <div style="text-align:center; margin-bottom:32px;">
                  <div style="display:inline-block; padding:18px;">
                    <!-- Logo Image -->
                    ${LOGO_IMAGE}
                  </div>
                </div>

                <!-- Heading -->
                <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                  Confirm Your Email Address
                </h1>

                <!-- Body Text -->
                <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                  Thank you for signing up to Rahvana.  
                  Please confirm your email address to activate your account and get started.
                </p>

                <!-- Button -->
                <div style="text-align:center; margin:36px 0;">
                  <a href="${confirmLink}"
                     style="display:inline-block;
                            padding:16px 40px;
                            background:#0d7377;
                            color:#ffffff;
                            text-decoration:none;
                            font-size:16px;
                            font-weight:600;
                            border-radius:14px;
                            box-shadow:0 6px 18px rgba(13,115,119,0.25);">
                    Confirm Email
                  </a>
                </div>

                <!-- Divider -->
                <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>

                <!-- Fallback -->
                <p style="margin:0 0 10px; font-size:14px; color:#64748b;">
                  If the button above doesn't work, copy and paste this link into your browser:
                </p>

                <p style="margin:0 0 28px; font-size:14px; color:#0d7377; word-break:break-word;">
                  ${confirmLink}
                </p>

                <!-- Expiry Box -->
                <div style="background:#e8f6f6; border-radius:12px; padding:16px;">
                  <p style="font-size:14px; margin-bottom:2px; color:#0a5a5d; font-weight:500;">
                    This link will expire in 24 hours.
                  </p>
                </div>

                <!-- Footer Note -->
                <p style="margin:28px 0 0; font-size:14px; color:#94a3b8; text-align:center;">
                  If you did not create an account, you can safely ignore this email.
                </p>

              </td>
            </tr>
          </table>

          <!-- Bottom Footer -->
          <p style="margin-top:28px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} Rahvana. All rights reserved.
          </p>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}

export function getPasswordResetEmailHtml(resetLink: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">

            <!-- Top Gradient Accent -->
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">

              <!-- Logo -->
              <div style="text-align:center; margin-bottom:32px;">
                <div style="display:inline-block; padding:18px;">
                  <!-- Logo Image -->
                  ${LOGO_IMAGE}
                </div>
              </div>

                <!-- Heading -->
                <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                  Reset Your Password
                </h1>

                <!-- Description -->
                <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                  We received a request to reset your password.  
                  Click the button below to create a new one.
                </p>

                <!-- CTA Button -->
                <div style="text-align:center; margin:36px 0;">
                  <a href="${resetLink}"
                     style="display:inline-block;
                            padding:16px 40px;
                            background:#0d7377;
                            color:#ffffff;
                            text-decoration:none;
                            font-size:16px;
                            font-weight:600;
                            border-radius:14px;
                            box-shadow:0 6px 18px rgba(13,115,119,0.25);">
                    Reset Password
                  </a>
                </div>

                <!-- Divider -->
                <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>

                <!-- Fallback Link -->
                <p style="margin:0 0 10px; font-size:14px; color:#64748b;">
                  If the button above doesn't work, copy and paste this link into your browser:
                </p>

                <p style="margin:0 0 28px; font-size:14px; color:#0d7377; word-break:break-word;">
                  ${resetLink}
                </p>

                <!-- Security Notice Box -->
                <div style="background:#fff4e5; border-radius:12px; padding:16px; margin-bottom:24px;">
                <p style="font-size:14px; margin-bottom:2px; color:#0a5a5d; font-weight:500;">
                  This link will expire in 1 hour for security reasons.
                </p>
                </div>

                <!-- Footer Note -->
                <p style="margin:0; font-size:14px; line-height:20px; color:#94a3b8; text-align:center;">
                  If you did not request a password reset, you can safely ignore this email.  
                  Your password will remain unchanged.
                </p>

              </td>
            </tr>
          </table>

          <!-- Bottom Footer -->
          <p style="margin-top:28px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} Rahvana. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export function getPasswordChangedHtml(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Changed</title>
  </head>
  <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">

            <!-- Top Accent Bar -->
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">

                <!-- Logo -->
                <div style="text-align:center; margin-bottom:32px;">
                  <div style="display:inline-block; padding:18px;">
                    ${LOGO_IMAGE}
                  </div>
                </div>

                <!-- Heading -->
                <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                  Password Changed Successfully
                </h1>

                <!-- Body -->
                <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                  This is a confirmation that the password for your Rahvana account has been changed successfully.
                </p>

                <div style="background:#e8f6f6; border-radius:12px; padding:18px; margin:30px 0;">
                  <p style="margin:0; font-size:15px; line-height:1.6; color:#0a5a5d;">
                    <strong>Didn't make this change?</strong><br /><br />
                    If you did not change your password, your account may have been compromised.
                    Please reset your password immediately and contact our support team if you need assistance.
                  </p>
                </div>

                <!-- Divider -->
                <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>

                <!-- Footer -->
                <p style="margin:0; font-size:14px; line-height:1.7; color:#64748b; text-align:center;">
                  If you changed your password, no further action is required.
                </p>

                <p style="margin:28px 0 0; font-size:14px; color:#94a3b8; text-align:center;">
                  Thank you for helping keep your Rahvana account secure.
                </p>

              </td>
            </tr>
          </table>

          <!-- Bottom Footer -->
          <p style="margin-top:28px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} Rahvana. All rights reserved.
          </p>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}

export function getMFAEnabledEmailHtml(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Two-Factor Authentication Enabled</title>
  </head>
  <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">

            <!-- Top Gradient Accent -->
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">

              <!-- Logo -->
              <div style="text-align:center; margin-bottom:32px;">
                <div style="display:inline-block; padding:18px;">
                  <!-- Logo Image -->
                  ${LOGO_IMAGE}
                </div>
              </div>

                <!-- Heading -->
                <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                  Two-Factor Authentication Enabled
                </h1>
              
                <!-- Main Message -->
                <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                  Great news! Two-factor authentication has been successfully enabled on your account.
                </p>

                <!-- Success Highlight Box -->
                <div style="background:#e8f6f6; border-radius:12px; padding:16px; margin:24px 0;">
                  <p style="margin:0; font-size:14px; color:#0a5a5d; font-weight:500;">
                    Your account now has an additional layer of protection.
                  </p>
                </div>

                <!-- Explanation -->
                <p style="margin:0 0 28px; font-size:16px; line-height:1.7; color:#475569;">
                  From now on, you'll need to enter a verification code from your authenticator app when signing in.
                </p>

                <!-- Divider -->
                <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>

                <!-- Security Tips -->
                <h3 style="margin:0 0 16px; font-size:18px; font-weight:600; color:#0d7377;">
                  Security Tips
                </h3>

                <ul style="margin:0 0 28px; padding-left:20px; font-size:14px; color:#475569; line-height:1.7;">
                  <li style="margin-bottom:8px;">Keep your authenticator app secure</li>
                  <li style="margin-bottom:8px;">Never share your verification codes</li>
                  <li>Store your recovery codes in a safe place</li>
                </ul>

                <!-- Warning Footer -->
                <div style="background:#fff4e5; border-radius:12px; padding:16px;">
                  <p style="margin:0; font-size:14px; color:#92400e;">
                    If you did not enable two-factor authentication, please contact our support team immediately.
                  </p>
                </div>

              </td>
            </tr>
          </table>

          <!-- Bottom Footer -->
          <p style="margin-top:28px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} Rahvana. All rights reserved.
          </p>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}

export function getMFADisabledEmailHtml(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Two-Factor Authentication Disabled</title>
  </head>
  <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">

            <!-- Top Gradient Accent -->
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">

              <!-- Logo -->
              <div style="text-align:center; margin-bottom:32px;">
                <div style="display:inline-block; padding:18px;">
                  <!-- Logo Image -->
                  ${LOGO_IMAGE}
                </div>
              </div>

                <!-- Heading -->
                <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                  Two-Factor Authentication Disabled
                </h1>

                <!-- Main Text -->
                <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                  Two-factor authentication has been disabled on your account.
                </p>

                <!-- Security Reduced Notice -->
                <div style="background:#fff4e5; border-radius:12px; padding:16px; margin:24px 0;">
                  <p style="margin:0; font-size:14px; color:#92400e; font-weight:500;">
                    Your account security has been reduced. We strongly recommend enabling 2FA again.
                  </p>
                </div>

                <!-- Explanation -->
                <p style="margin:0 0 28px; font-size:16px; line-height:1.7; color:#475569;">
                  You will no longer be required to enter a verification code when signing in.
                </p>

                <!-- Critical Security Warning -->
                <div style="background:#fee2e2; border-radius:12px; padding:18px; margin-bottom:32px;">
                  <h3 style="margin:0 0 10px; font-size:16px; font-weight:600; color:#991b1b;">
                    Security Notice
                  </h3>
                  <p style="margin:0; font-size:14px; color:#b91c1c; line-height:1.6;">
                    If you did not disable two-factor authentication, your account may have been compromised. 
                    Please re-enable 2FA immediately and change your password.
                  </p>
                </div>

                <!-- CTA -->
                <div style="text-align:center; margin-bottom:28px;">
                  <a href="${appUrl}/mfa-setup"
                     style="display:inline-block;
                            padding:16px 40px;
                            background:#0d7377;
                            color:#ffffff;
                            text-decoration:none;
                            font-size:16px;
                            font-weight:600;
                            border-radius:14px;
                            box-shadow:0 6px 18px rgba(13,115,119,0.25);">
                    Re-enable 2FA
                  </a>
                </div>

                <!-- Footer Text -->
                <p style="margin:0; font-size:14px; line-height:20px; color:#94a3b8; text-align:center;">
                  If you have any questions about this change, please contact our support team.
                </p>

              </td>
            </tr>
          </table>

          <!-- Bottom Footer -->
          <p style="margin-top:28px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} Rahvana. All rights reserved.
          </p>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}

export function getFeatureAnnouncementEmailHtml(
  title: string,
  description: string,
  featureUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Feature Released</title>
    </head>
    <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">

            <!-- Main Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">
              
              <!-- Top Accent Bar -->
              <tr>
                <td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td>
              </tr>

              <tr>
                <td style="padding:48px 40px;">

                  <!-- Logo -->
                  <div style="text-align:center; margin-bottom:32px;">
                    <div style="display:inline-block; padding:18px;">
                      ${LOGO_IMAGE}
                    </div>
                  </div>

                  <!-- Heading -->
                  <h1 style="margin:0 0 20px; font-size:26px; font-weight:700; color:#0d7377; text-align:center;">
                    ${title}
                  </h1>

                  <!-- Description -->
                  <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#475569; text-align:center;">
                    ${description}
                  </p>

                  <!-- Highlight Box -->
                  <div style="background-color:#ecfeff; border-radius:12px; padding:16px; margin:24px 0;">
                    <p style="margin:0; font-size:14px; color:#0e7490; font-weight:500; text-align:center;">
                      This feature is now live and ready for you to explore.
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center; margin:32px 0;">
                    <a href="${featureUrl}" 
                       style="display:inline-block; padding:16px 40px; background-color:#0d7377; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; border-radius:14px; box-shadow:0 6px 18px rgba(13,115,119,0.25);">
                      Explore Feature
                    </a>
                  </div>

                  <!-- Footer Text -->
                  <p style="margin:0; font-size:14px; color:#94a3b8; text-align:center;">
                    Thank you for being part of Rahvana. We're constantly improving to make your experience better.
                  </p>

                </td>
              </tr>
            </table>

            <!-- Bottom Footer -->
            <p style="margin-top:28px; font-size:12px; color:#94a3b8; text-align:center;">
              © ${new Date().getFullYear()} Rahvana. All rights reserved.
            </p>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

export function getBlogWelcomeEmailHtml(unsubscribeUrl: string): string {
  const exploreUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com"}/blog`;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to Rahvana Knowledge Center</title>
    </head>
    <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">
              <tr><td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td></tr>
              <tr>
                <td style="padding:48px 40px;">
                  <div style="text-align:center; margin-bottom:28px;">${LOGO_IMAGE}</div>
                  <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; color:#0d7377; text-align:center;">Welcome to Rahvana Knowledge Center!</h1>
                  <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#475569; text-align:center;">
                    You are now subscribed to receive our latest U.S. immigration guides, NVC document checklists, and consular interview preparation insights written specifically for Pakistani applicants and U.S. sponsors.
                  </p>
                  <div style="background-color:#f0fdfa; border:1px solid #ccfbf1; border-radius:12px; padding:16px; margin:24px 0; text-align:center;">
                    <p style="margin:0; font-size:14px; color:#0d9488; font-weight:600;">You'll only receive high-value guides when new immigration research or policy updates are published.</p>
                  </div>
                  <div style="text-align:center; margin:32px 0;">
                    <a href="${exploreUrl}" style="display:inline-block; padding:14px 36px; background-color:#0d7377; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; border-radius:12px; box-shadow:0 6px 18px rgba(13,115,119,0.25);">Explore Current Guides</a>
                  </div>
                  <p style="margin:24px 0 0; font-size:12px; color:#94a3b8; text-align:center;">
                    If you did not request this subscription, you can <a href="${unsubscribeUrl}" style="color:#0d7377; text-decoration:underline;">unsubscribe at any time</a>.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin-top:24px; font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} Rahvana. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getBlogAnnouncementEmailHtml(params: {
  title: string;
  description: string;
  articleUrl: string;
  readTime?: string;
  category?: string;
  imageUrl?: string;
  unsubscribeUrl: string;
}): string {
  const { title, description, articleUrl, readTime = "8 min read", category = "Immigration Guide", imageUrl, unsubscribeUrl } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com";
  const fullImageUrl = imageUrl
    ? (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
        ? imageUrl
        : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`)
    : null;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#e8f6f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:18px; box-shadow:0 8px 24px rgba(13,115,119,0.08); overflow:hidden;">
              <tr><td style="height:4px; background:linear-gradient(90deg,#0d7377,#14a0a6,#32e0c4);"></td></tr>
              <tr>
                <td style="padding:44px 36px;">
                  <div style="text-align:center; margin-bottom:24px;">${LOGO_IMAGE}</div>
                  <div style="text-align:center; margin-bottom:12px;">
                    <span style="display:inline-block; padding:4px 14px; background-color:#f0fdfa; border:1px solid #99f6e4; color:#0d9488; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">
                      ${category} • ${readTime}
                    </span>
                  </div>
                  <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; color:#0f2e2b; text-align:center; line-height:1.3;">
                    ${title}
                  </h1>
                  ${
                    fullImageUrl
                      ? `
                  <div style="margin: 20px 0 24px; text-align: center;">
                    <a href="${articleUrl}" style="text-decoration: none; display: block;">
                      <img
                        src="${fullImageUrl}"
                        alt="${title}"
                        style="width: 100%; max-width: 528px; height: auto; border-radius: 12px; display: block; margin: 0 auto; border: 1px solid #e2e8f0; object-fit: cover;"
                      />
                    </a>
                  </div>
                  `
                      : ""
                  }
                  <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#475569; text-align:left;">
                    ${description}
                  </p>
                  <div style="text-align:center; margin:32px 0 24px;">
                    <a href="${articleUrl}" style="display:inline-block; padding:15px 38px; background-color:#0d7377; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; border-radius:12px; box-shadow:0 6px 18px rgba(13,115,119,0.25);">
                      Read Complete Guide →
                    </a>
                  </div>
                  <hr style="border:none; border-top:1px solid #e2e8f0; margin:32px 0 20px;" />
                  <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center; line-height:1.5;">
                    You received this email because you subscribed to guides at Rahvana Knowledge Center.<br/>
                    <a href="${unsubscribeUrl}" style="color:#0d7377; text-decoration:underline;">Click here to unsubscribe</a>.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin-top:24px; font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} Rahvana. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
