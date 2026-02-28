import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}

export class EmailHelper {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (!env.APP_MAIL || !env.APP_PW) {
        throw new Error("APP_ID and APP_PW must be set to send email");
      }
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 456,
        secure: true,
        auth: {
          user: env.APP_MAIL,
          pass: env.APP_PW,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const transporter = this.getTransporter();
    const mailOptions = {
      from: {
        name: "BazarCo",
        address: env.APP_MAIL,
      },
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    const result = await transporter.sendMail(mailOptions);
    logger.info("Email sent", { to: options.to, messageId: result.messageId });
  }
}

export const emailHelper = new EmailHelper();
