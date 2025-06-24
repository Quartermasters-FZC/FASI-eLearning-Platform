/**
 * Email Utility Functions
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Email sending and template management for notifications
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

interface EmailTemplates {
    [key: string]: {
        subject: string;
        html: (data: Record<string, any>) => string;
        text: (data: Record<string, any>) => string;
    };
}

// Email templates for different purposes
const EMAIL_TEMPLATES: EmailTemplates = {
    'email-verification': {
        subject: 'Verify Your eLearning Platform Account',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Email Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to AI-Powered eLearning Platform</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.firstName}!</h2>
                        <p>Thank you for registering with our AI-powered language learning platform. To complete your account setup, please verify your email address.</p>
                        
                        <p><a href="${data.verificationUrl}" class="button">Verify Email Address</a></p>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
                        
                        <p>This verification link will expire in 24 hours for security reasons.</p>
                        
                        <p>If you didn't create this account, please ignore this email.</p>
                        
                        <div class="footer">
                            <p>Best regards,<br>Quartermasters FZC Team</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: (data) => `
            Welcome to AI-Powered eLearning Platform
            
            Hello ${data.firstName}!
            
            Thank you for registering with our AI-powered language learning platform. To complete your account setup, please verify your email address.
            
            Verification Link: ${data.verificationUrl}
            
            This verification link will expire in 24 hours for security reasons.
            
            If you didn't create this account, please ignore this email.
            
            Best regards,
            Quartermasters FZC Team
        `
    },

    'password-reset': {
        subject: 'Reset Your Password - eLearning Platform',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.firstName || 'User'}!</h2>
                        <p>We received a request to reset the password for your eLearning Platform account.</p>
                        
                        <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
                        
                        <div class="warning">
                            <p><strong>Security Notice:</strong></p>
                            <ul>
                                <li>This password reset link will expire in 1 hour</li>
                                <li>If you didn't request this reset, please ignore this email</li>
                                <li>For security, change your password immediately if you suspect unauthorized access</li>
                            </ul>
                        </div>
                        
                        <div class="footer">
                            <p>Best regards,<br>Quartermasters FZC Team</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: (data) => `
            Password Reset Request
            
            Hello ${data.firstName || 'User'}!
            
            We received a request to reset the password for your eLearning Platform account.
            
            Reset Link: ${data.resetUrl}
            
            Security Notice:
            - This password reset link will expire in 1 hour
            - If you didn't request this reset, please ignore this email
            - For security, change your password immediately if you suspect unauthorized access
            
            Best regards,
            Quartermasters FZC Team
        `
    },

    'account-locked': {
        subject: 'Security Alert: Account Locked - eLearning Platform',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Account Locked</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; }
                    .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Security Alert</h1>
                    </div>
                    <div class="content">
                        <div class="alert">
                            <h2>Account Temporarily Locked</h2>
                            <p>Your account (${data.email}) has been temporarily locked due to multiple failed login attempts.</p>
                        </div>
                        
                        <h3>What happened?</h3>
                        <p>For security reasons, we lock accounts after several unsuccessful login attempts. This helps protect your account from unauthorized access.</p>
                        
                        <h3>What should you do?</h3>
                        <ul>
                            <li>Wait ${data.lockoutDuration} before attempting to log in again</li>
                            <li>Make sure you're using the correct email and password</li>
                            <li>If you forgot your password, use the "Forgot Password" option</li>
                            <li>Contact support if you believe this was not you</li>
                        </ul>
                        
                        <h3>Security Tips:</h3>
                        <ul>
                            <li>Use a strong, unique password</li>
                            <li>Enable two-factor authentication</li>
                            <li>Don't share your login credentials</li>
                        </ul>
                        
                        <div class="footer">
                            <p>If you believe this was not you, please contact our support team immediately.</p>
                            <p>Best regards,<br>Quartermasters FZC Security Team</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: (data) => `
            Security Alert: Account Temporarily Locked
            
            Your account (${data.email}) has been temporarily locked due to multiple failed login attempts.
            
            What happened?
            For security reasons, we lock accounts after several unsuccessful login attempts. This helps protect your account from unauthorized access.
            
            What should you do?
            - Wait ${data.lockoutDuration} before attempting to log in again
            - Make sure you're using the correct email and password
            - If you forgot your password, use the "Forgot Password" option
            - Contact support if you believe this was not you
            
            Security Tips:
            - Use a strong, unique password
            - Enable two-factor authentication
            - Don't share your login credentials
            
            If you believe this was not you, please contact our support team immediately.
            
            Best regards,
            Quartermasters FZC Security Team
        `
    },

    'welcome': {
        subject: 'Welcome to AI-Powered eLearning Platform!',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #059669; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Our Platform!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.firstName}!</h2>
                        <p>Congratulations! Your email has been verified and your account is now active.</p>
                        
                        <h3>🚀 Get Started:</h3>
                        <ul>
                            <li>Complete your profile setup</li>
                            <li>Choose your target languages</li>
                            <li>Set your learning goals</li>
                            <li>Take a placement assessment</li>
                        </ul>
                        
                        <p><a href="${data.dashboardUrl}" class="button">Go to Dashboard</a></p>
                        
                        <h3>🎯 What's Next?</h3>
                        <p>Our AI-powered platform will create personalized learning paths based on your goals and current proficiency level. You'll have access to:</p>
                        <ul>
                            <li>Interactive lessons with speech recognition</li>
                            <li>Real-time pronunciation feedback</li>
                            <li>Cultural context and professional scenarios</li>
                            <li>Progress tracking and analytics</li>
                        </ul>
                        
                        <div class="footer">
                            <p>Need help? Check out our <a href="${data.helpUrl}">Help Center</a> or contact support.</p>
                            <p>Best regards,<br>Quartermasters FZC Team</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: (data) => `
            Welcome to AI-Powered eLearning Platform!
            
            Hello ${data.firstName}!
            
            Congratulations! Your email has been verified and your account is now active.
            
            Get Started:
            - Complete your profile setup
            - Choose your target languages
            - Set your learning goals
            - Take a placement assessment
            
            Dashboard: ${data.dashboardUrl}
            
            What's Next?
            Our AI-powered platform will create personalized learning paths based on your goals and current proficiency level. You'll have access to:
            - Interactive lessons with speech recognition
            - Real-time pronunciation feedback
            - Cultural context and professional scenarios
            - Progress tracking and analytics
            
            Need help? Check out our Help Center or contact support.
            
            Best regards,
            Quartermasters FZC Team
        `
    }
};

// Create nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function initializeTransporter(): nodemailer.Transporter {
    if (transporter) {
        return transporter;
    }

    const emailConfig = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    };

    // For development, use Ethereal Email for testing
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        logger.warn('No SMTP configuration found. Email functionality will be simulated.');
        // In development, you can use Ethereal Email or nodemailer testing account
        return nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });
    }

    transporter = nodemailer.createTransporter(emailConfig);
    return transporter;
}

/**
 * Send email using template
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        // Get email template
        const template = EMAIL_TEMPLATES[options.template];
        if (!template) {
            throw new Error(`Email template '${options.template}' not found`);
        }

        // Generate email content
        const htmlContent = template.html(options.data);
        const textContent = template.text(options.data);
        const subject = options.subject || template.subject;

        // Initialize transporter
        const emailTransporter = initializeTransporter();

        // Send email
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@quartermasters.me',
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject,
            html: htmlContent,
            text: textContent,
            attachments: options.attachments
        };

        // In development mode, log email instead of sending
        if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
            logger.info('=== EMAIL SIMULATION ===');
            logger.info(`To: ${options.to}`);
            logger.info(`Subject: ${subject}`);
            logger.info(`Template: ${options.template}`);
            logger.info(`Content Preview: ${textContent.substring(0, 200)}...`);
            logger.info('=========================');
            return true;
        }

        const info = await emailTransporter.sendMail(mailOptions);
        logger.info(`Email sent successfully: ${info.messageId}`);
        
        return true;
    } catch (error) {
        logger.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error}`);
    }
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get available email templates
 */
export function getAvailableTemplates(): string[] {
    return Object.keys(EMAIL_TEMPLATES);
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
    try {
        const emailTransporter = initializeTransporter();
        await emailTransporter.verify();
        logger.info('Email configuration is valid');
        return true;
    } catch (error) {
        logger.error('Email configuration test failed:', error);
        return false;
    }
}