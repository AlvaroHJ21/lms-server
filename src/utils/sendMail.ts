import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import type { Options } from 'nodemailer/lib/mailer';

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export default async (options: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;

  // get the pdath of the email template file
  const templatePath = path.join(__dirname, '../mails', template);

  // render the email template with EJS
  const html: string = await ejs.renderFile(templatePath, data);

  const emailoptions: Options = {
    from: process.env.SMTP_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(emailoptions);
};
