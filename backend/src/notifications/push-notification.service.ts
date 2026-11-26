import { Injectable, Logger } from '@nestjs/common';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';

export interface PushNotificationPayload {
  userId?: number | null;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseReady = false;
  private initAttempted = false;
  private tableEnsured = false;

  constructor(private readonly prisma: PrismaService) {}

  private async ensureDeviceTokenTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DeviceToken" (
          "id" SERIAL NOT NULL,
          "userId" INTEGER NOT NULL,
          "token" TEXT NOT NULL,
          "platform" TEXT NOT NULL DEFAULT 'android',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await this.prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "DeviceToken_token_key" ON "DeviceToken"("token");`,
      );
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "DeviceToken_userId_idx" ON "DeviceToken"("userId");`,
      );
      this.tableEnsured = true;
    } catch (error) {
      this.logger.warn(`ensureDeviceTokenTable warning: ${String(error)}`);
    }
  }

  private ensureFirebaseInitialized(): boolean {
    if (this.firebaseReady) return true;
    if (this.initAttempted) return false;
    this.initAttempted = true;

    try {
      if (getApps().length > 0) {
        this.firebaseReady = true;
        return true;
      }

      const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
      if (serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
        const parsed = JSON.parse(serviceAccountJson) as ServiceAccount;
        initializeApp({
          credential: cert(parsed),
        });
        this.firebaseReady = true;
        this.logger.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON.');
        return true;
      }

      const projectId = process.env['FIREBASE_PROJECT_ID']?.trim();
      const clientEmail = process.env['FIREBASE_CLIENT_EMAIL']?.trim();
      const rawPrivateKey = process.env['FIREBASE_PRIVATE_KEY'];

      if (projectId && clientEmail && rawPrivateKey) {
        const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.firebaseReady = true;
        this.logger.log('Firebase Admin initialized from FIREBASE_* environment variables.');
        return true;
      }

      this.logger.warn(
        'Firebase Admin belum dikonfigurasi (set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY atau FIREBASE_SERVICE_ACCOUNT_JSON). Push notification dilewati.',
      );
      return false;
    } catch (error) {
      this.logger.error('Gagal menginisialisasi Firebase Admin:', error);
      return false;
    }
  }

  get isConfigured(): boolean {
    return this.ensureFirebaseInitialized();
  }

  async registerToken(userId: number, token: string, platform = 'android') {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { registered: false, message: 'Token perangkat tidak valid.' };
    }

    await this.ensureDeviceTokenTable();
    await this.prisma.deviceToken.upsert({
      where: { token: cleanToken },
      update: {
        userId,
        platform: platform.trim().toLowerCase() || 'android',
      },
      create: {
        userId,
        token: cleanToken,
        platform: platform.trim().toLowerCase() || 'android',
      },
    });

    return {
      registered: true,
      firebaseConfigured: this.isConfigured,
    };
  }

  async unregisterToken(userId: number, token?: string) {
    await this.ensureDeviceTokenTable();
    if (token && token.trim().length > 0) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: token.trim(), userId },
      });
    } else {
      await this.prisma.deviceToken.deleteMany({
        where: { userId },
      });
    }
    return { unregistered: true };
  }

  async sendTestPush(userId: number) {
    if (!this.ensureFirebaseInitialized()) {
      return {
        sent: false,
        reason: 'Firebase Admin belum dikonfigurasi di server.',
      };
    }

    await this.ensureDeviceTokenTable();
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return {
        sent: false,
        reason: 'Belum ada perangkat mobile yang terdaftar untuk akun ini.',
      };
    }

    const result = await this.sendMulticast(
      tokens.map((t) => t.token),
      {
        title: 'Tes Notifikasi PRIMA',
        message: 'Notifikasi latar belakang Firebase Cloud Messaging aktif dan terhubung.',
        type: 'INFO',
        link: '/notifications',
      },
    );

    return {
      sent: result.successCount > 0,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  async sendForNotifications(items: PushNotificationPayload[]): Promise<void> {
    if (!items.length || !this.ensureFirebaseInitialized()) return;

    const sendTask = async () => {
      try {
        await this.ensureDeviceTokenTable();
        const broadcastItems = items.filter((item) => item.userId == null);
        const targetedItems = items.filter((item) => item.userId != null);

        // 1. Targeted notifications grouped by title+message so multicast is efficient
        if (targetedItems.length > 0) {
          const userIds = Array.from(
            new Set(targetedItems.map((item) => item.userId as number)),
          );
          const tokenRows = await this.prisma.deviceToken.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, token: true },
          });

          const tokensByUser = new Map<number, string[]>();
          for (const row of tokenRows) {
            const list = tokensByUser.get(row.userId) ?? [];
            list.push(row.token);
            tokensByUser.set(row.userId, list);
          }

          const grouped = new Map<
            string,
            { payload: PushNotificationPayload; tokens: Set<string> }
          >();

          for (const item of targetedItems) {
            const userTokens = tokensByUser.get(item.userId as number);
            if (!userTokens || userTokens.length === 0) continue;
            const key = `${item.title}||${item.message}||${item.link ?? ''}`;
            const entry = grouped.get(key) ?? {
              payload: item,
              tokens: new Set<string>(),
            };
            for (const tk of userTokens) entry.tokens.add(tk);
            grouped.set(key, entry);
          }

          for (const entry of grouped.values()) {
            await this.sendMulticast(Array.from(entry.tokens), entry.payload);
          }
        }

        // 2. Broadcast notifications (userId == null) -> send to all active mobile users
        if (broadcastItems.length > 0) {
          const allTokens = await this.prisma.deviceToken.findMany({
            where: {
              user: {
                deletedAt: null,
                status: 'AKTIF',
              },
            },
            select: { token: true },
          });
          const tokenList = Array.from(new Set(allTokens.map((t) => t.token)));
          if (tokenList.length > 0) {
            for (const item of broadcastItems) {
              await this.sendMulticast(tokenList, item);
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Gagal mengirim push notification FCM: ${String(error)}`);
      }
    };

    // Bounded wait (maks 3.5 detik) agar selesai di Vercel Serverless tanpa memperlambat API
    await Promise.race([
      sendTask(),
      new Promise<void>((resolve) => setTimeout(resolve, 3500)),
    ]);
  }

  private async sendMulticast(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    // FCM multicast limit is 500 tokens per batch
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      try {
        const response = await getMessaging().sendEachForMulticast({
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.message,
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'prima_notifications',
              sound: 'default',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
          data: {
            title: payload.title,
            body: payload.message,
            type: payload.type ?? 'INFO',
            link: payload.link ?? '',
          },
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const code = res.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(batch[idx]);
            }
          }
        });
      } catch (error) {
        this.logger.warn(`Batch FCM send gagal: ${String(error)}`);
        failureCount += batch.length;
      }
    }

    if (invalidTokens.length > 0) {
      try {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
      } catch {
        // ignore cleanup error
      }
    }

    return { successCount, failureCount };
  }
}
