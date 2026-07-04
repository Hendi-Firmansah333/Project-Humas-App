import { Injectable } from '@nestjs/common';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  time: string;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  private notifications: NotificationItem[] = [
    {
      id: 1,
      title: 'Jadwal Liputan Baru',
      message: 'Anda ditugaskan meliput Kunjungan Industri pukul 09:00 WIB di Gedung Serbaguna.',
      type: 'INFO',
      time: '10 menit yang lalu',
      read: false,
    },
    {
      id: 2,
      title: 'Verifikasi Konten',
      message: 'Reels Instagram "Dies Natalis ke-41" telah disetujui oleh Koordinator Humas.',
      type: 'SUCCESS',
      time: '1 jam yang lalu',
      read: false,
    },
    {
      id: 3,
      title: 'Peminjaman Alat',
      message: 'Pengembalian Kamera Sony A7III dijadwalkan hari ini sebelum pukul 16:00 WIB.',
      type: 'WARNING',
      time: '3 jam yang lalu',
      read: true,
    },
  ];

  async findAll() {
    return this.notifications;
  }

  async markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    return { message: 'Semua notifikasi ditandai sudah dibaca.' };
  }
}
