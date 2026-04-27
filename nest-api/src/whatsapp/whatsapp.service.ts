import { Injectable, Global } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly sid = process.env.WHATSAPP_API_SID;
  private readonly token = process.env.WHATSAPP_API_TOKEN;
  private readonly from = process.env.WHATSAPP_FROM_NUMBER;

  async sendAutomatedMessage(to: string, message: string): Promise<boolean> {
    // Check for missing credentials
    if (!this.sid || !this.token || !this.from) {
      const missing: string[] = [];
      if (!this.sid) missing.push('WHATSAPP_API_SID');
      if (!this.token) missing.push('WHATSAPP_API_TOKEN');
      if (!this.from) missing.push('WHATSAPP_FROM_NUMBER');
      
      console.warn(`[WhatsApp Simulation] Missing environment variables: ${missing.join(', ')}. Defaulting to simulation mode.`);
      console.log(`[WhatsApp Simulation] To: ${to}, Message: ${message}`);
      return true;
    }

    try {
      // Clean phone number: remove all non-digits
      const digitsOnly = to.replace(/\D/g, '');
      const formattedPhone = `whatsapp:+${digitsOnly}`;
      
      const auth = Buffer.from(`${this.sid}:${this.token}`).toString('base64');
      
      console.log(`[WhatsApp API] Attempting to send message to ${formattedPhone}...`);
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: this.from,
            Body: message,
          }),
        },
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('[WhatsApp API] Error Response:', JSON.stringify(data, null, 2));
        return false;
      }

      console.log(`[WhatsApp API] Success! Message SID: ${data.sid}, Status: ${data.status}`);
      
      if (data.status === 'failed' || data.status === 'undelivered') {
        console.warn(`[WhatsApp API] Warning: Message accepted but status is ${data.status}. Reason: ${data.error_message || 'Unknown'}`);
      }
      
      return true;
    } catch (error) {
      console.error('[WhatsApp Service] Runtime Error:', error.message);
      return false;
    }
  }
}
