import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  //TODO: Customise Email
  async sendToken(email: string, userTag: string, token: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: '🕹️ Verifica tu cuenta - Videojuegos Shop',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; padding: 40px; border-radius: 10px; text-align: center;">
            <h1 style="color: #00ffcc;">¡Bienvenido, <span style="color: #00ffcc;">${userTag}</span>!</h1>
            <p style="font-size: 16px;">Has solicitado un código para acceder a tu cuenta de la tienda.</p>
            <div style="background-color: #333; padding: 20px; margin: 20px auto; width: fit-content; border: 2px dashed #00ffcc; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00ffcc;">${token}</span>
            </div>
            <p style="font-size: 12px; color: #888;">Este código es válido por 10 minutos. No lo compartas con nadie.</p>
            <hr style="border: 0; border-top: 1px solid #444; margin: 20px 0;">
            <p style="font-size: 10px; color: #666;">Videojuegos Shop S.A. © 2025</p>
          </div>
        `,
      });

      this.logger.log(
        `Correo enviado con éxito a ${email}. ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error enviando correo a ${email}:`, error.message);
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de verificación',
      );
    }
  }

  async sendPasswordResetToken(email: string, userTag: string, token: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: '🔑 Restablece tu contraseña - Videojuegos CheckPoint',
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 40px; text-align: center; border-radius: 15px;">
          <h1 style="color: #9d50bb;"><span style="color: #9d50bb;">${userTag}</span>, ¿Olvidaste tu contraseña?</h1>
          <p style="font-size: 16px; color: #cccccc;">No te preocupes, nos pasa hasta a los mejores jugadores. Usa el siguiente código para volver a la partida:</p>
          
          <div style="background: linear-gradient(135deg, #9d50bb 0%, #6e48aa 100%); padding: 20px; margin: 30px auto; width: fit-content; border-radius: 10px; box-shadow: 0 4px 15px rgba(157, 80, 187, 0.4);">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ffffff;">${token}</span>
          </div>

          <p style="font-size: 14px; color: #888;">Este código expirará en 15 minutos.</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
            <p style="font-size: 12px; color: #555;">Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          </div>
        </div>
      `,
      });
      this.logger.log(`Email de reset enviado a: ${email}`);
    } catch (error) {
      this.logger.error('Error enviando reset email', error.stack);
      throw new InternalServerErrorException('Error al enviar el correo');
    }
  }
}
