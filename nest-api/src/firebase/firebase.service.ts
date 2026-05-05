import * as admin from 'firebase-admin';
import * as path from 'path';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    const serviceAccountPath = path.join(process.cwd(), 'src/config/firebase-service-account.json');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log('Firebase Admin SDK initialized successfully');
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    const message = {
      notification: {
        title,
        body,
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'alarm_sound', // Custom sound for Android
          channelId: 'incident_alerts',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'alarm_sound.wav', // Custom sound for iOS
            contentAvailable: true,
          },
        },
      },
      data: data || {},
      token: token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent FCM message:', response);
      return response;
    } catch (error) {
      console.error('Error sending FCM message:', error);
      throw error;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any) {
    const message = {
      notification: {
        title,
        body,
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'alarm_sound',
          channelId: 'incident_alerts',
        },
      },
      data: data || {},
      topic: topic,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent FCM message to topic:', response);
      return response;
    } catch (error) {
      console.error('Error sending FCM message to topic:', error);
      throw error;
    }
  }
}
