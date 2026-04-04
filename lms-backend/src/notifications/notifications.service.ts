import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

type NotificationAudience = {
  userId?: string;
  name: string;
  email?: string;
  mobileNumber?: string;
};

type MailTransporter = {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
};

type NodemailerModule = {
  createTransport(options: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  }): MailTransporter;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly mailTransporter: MailTransporter | null;
  private readonly mailFrom: string | null;
  private readonly twilioClient: Twilio | null;
  private readonly twilioFromNumber: string | null;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {
    const mailer = nodemailer as unknown as NodemailerModule;
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number.parseInt(
      this.configService.get<string>('SMTP_PORT') ?? '587',
      10,
    );
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.mailFrom = this.configService.get<string>('SMTP_FROM') ?? user ?? null;

    this.mailTransporter =
      host && user && pass
        ? mailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
          })
        : null;

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioFromNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') ?? null;
    this.twilioClient =
      accountSid && authToken ? new Twilio(accountSid, authToken) : null;
  }

  async sendSignupNotifications(user: NotificationAudience) {
    await this.createInAppNotification({
      userId: user.userId,
      title: 'Account created',
      message: 'Welcome to GreatStack LMS. Your account is ready to use.',
      type: 'signup',
    });
    await this.sendNotifications(user, {
      emailSubject: 'Welcome to GreatStack LMS',
      emailText: `Hi ${user.name}, your account was created successfully. Welcome to GreatStack LMS.`,
      smsText: `Hi ${user.name}, your GreatStack LMS account was created successfully.`,
    });
  }

  async sendLoginNotifications(user: NotificationAudience) {
    await this.createInAppNotification({
      userId: user.userId,
      title: 'Successful login',
      message: 'You signed in successfully to GreatStack LMS.',
      type: 'login',
    });
    await this.sendNotifications(user, {
      emailSubject: 'Login alert for GreatStack LMS',
      emailText: `Hi ${user.name}, your GreatStack LMS account was just signed in successfully.`,
      smsText: `Hi ${user.name}, your GreatStack LMS account was signed in successfully.`,
    });
  }

  async sendEnrollmentNotifications(
    user: NotificationAudience,
    courseTitle: string,
  ) {
    await this.createInAppNotification({
      userId: user.userId,
      title: 'Enrollment confirmed',
      message: `You are now enrolled in ${courseTitle}.`,
      type: 'enrollment',
    });
    await this.sendNotifications(user, {
      emailSubject: `Enrollment confirmed: ${courseTitle}`,
      emailText: `Hi ${user.name}, you have been enrolled in "${courseTitle}" on GreatStack LMS.`,
      smsText: `Enrollment confirmed for "${courseTitle}" on GreatStack LMS.`,
    });
  }

  async getUserNotifications(userId: string) {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }

  private async sendNotifications(
    user: NotificationAudience,
    payload: { emailSubject: string; emailText: string; smsText: string },
  ) {
    const tasks: Promise<unknown>[] = [];

    if (user.email) {
      tasks.push(
        this.sendEmail(user.email, payload.emailSubject, payload.emailText),
      );
    }

    if (user.mobileNumber) {
      tasks.push(this.sendSms(user.mobileNumber, payload.smsText));
    }

    await Promise.allSettled(tasks);
  }

  private async createInAppNotification(payload: {
    userId?: string;
    title: string;
    message: string;
    type: 'signup' | 'login' | 'enrollment' | 'system';
  }) {
    if (!payload.userId) {
      return;
    }

    try {
      await this.notificationModel.create({
        _id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        isRead: false,
        createdAtLabel: new Date().toLocaleString(),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create in-app notification: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    if (!this.mailTransporter || !this.mailFrom) {
      this.logger.debug(`Skipping email to ${to}: SMTP not configured.`);
      return;
    }

    try {
      await this.mailTransporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        text,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send email to ${to}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async sendSms(to: string, body: string) {
    if (!this.twilioClient || !this.twilioFromNumber) {
      this.logger.debug(`Skipping SMS to ${to}: Twilio not configured.`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        to,
        from: this.twilioFromNumber,
        body,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send SMS to ${to}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
