import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass) throw new Error("SMTP configuration is incomplete");
    const port = Number(process.env.SMTP_PORT ?? "465");
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const baseUrl = (process.env.WEB_APP_URL ?? "https://r4c.kynox.io").replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    await this.transporter().sendMail({
      from: `R4C <${from}>`,
      to: email,
      subject: "Reset your R4C password",
      text: `Use this secure link within 30 minutes to reset your R4C password: ${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `<p>Use the button below within 30 minutes to reset your R4C password.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
    });
  }
}
