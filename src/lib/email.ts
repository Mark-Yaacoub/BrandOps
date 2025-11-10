import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BrandOps <onboarding@resend.dev>', // Use your verified domain
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }

    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  tempPassword?: string
): Promise<boolean> {
  const passwordInfo = tempPassword
    ? `
    <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
    <p>Please log in and change your password immediately.</p>
    `
    : `<p>Please contact your administrator to set up your password.</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          code { background: #e5e7eb; padding: 4px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to BrandOps!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Your account has been created successfully.</p>
            ${passwordInfo}
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/login" class="button">
              Log In to BrandOps
            </a>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br>The BrandOps Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "Welcome to BrandOps!",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .warning { 
            background: #fef2f2; 
            border-left: 4px solid #ef4444; 
            padding: 15px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your BrandOps account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you're concerned.</p>
            </div>
            <p>Best regards,<br>The BrandOps Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "Password Reset Request - BrandOps",
    html,
  });
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeConfirmation(
  to: string,
  name: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
            <p>Best regards,<br>The BrandOps Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "Password Changed - BrandOps",
    html,
  });
}

/**
 * Send task assignment email
 */
export async function sendTaskAssignmentEmail({
  to,
  userName,
  taskTitle,
  taskDescription,
  taskUrl,
  assignedBy,
}: {
  to: string;
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  taskUrl: string;
  assignedBy: string;
}): Promise<boolean> {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .task-card { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px; }
          .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
          .footer { margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>${assignedBy} has assigned you a new task:</p>
            <div class="task-card">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1f2937;">${taskTitle}</h2>
              ${taskDescription ? `<p style="margin: 0; color: #6b7280;">${taskDescription}</p>` : ''}
            </div>
            <a href="${taskUrl}" class="btn">View Task Details</a>
            <p class="footer">This is an automated email from BrandOps. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `New Task Assigned: ${taskTitle}`,
    html,
  });
}

/**
 * Send task mention email
 */
export async function sendTaskMentionEmail({
  to,
  userName,
  taskTitle,
  mentionedBy,
  taskUrl,
  comment,
}: {
  to: string;
  userName: string;
  taskTitle: string;
  mentionedBy: string;
  taskUrl: string;
  comment?: string;
}): Promise<boolean> {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .task-card { background: white; padding: 20px; border-left: 4px solid #059669; margin: 20px 0; border-radius: 4px; }
          .comment { margin: 10px 0 0 0; padding: 10px; background: #f3f4f6; border-radius: 4px; color: #4b5563; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
          .footer { margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You were mentioned</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p><strong>${mentionedBy}</strong> mentioned you in a task:</p>
            <div class="task-card">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1f2937;">${taskTitle}</h2>
              ${comment ? `<p class="comment">"${comment}"</p>` : ''}
            </div>
            <a href="${taskUrl}" class="btn">View Task Details</a>
            <p class="footer">This is an automated email from BrandOps. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `You were mentioned in: ${taskTitle}`,
    html,
  });
}
