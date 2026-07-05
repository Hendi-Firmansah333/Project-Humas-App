export const APP_CONFIG = {
  name: 'TIM HUMAS POLINELA',
  description: 'Sistem Informasi Kehumasan Berbasis Mobile dan Website',
  version: '1.0.0',
  defaultPageSize: 10,
};

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin Humas' },
  { value: 'USER', label: 'Anggota Humas' },
];

export const JOB_DESK_OPTIONS = [
  'Reporter',
  'Dokumentasi',
  'Live Report',
  'Operator',
  'MC Pendamping',
  'Koordinator Lapangan',
  'Humas Pendamping',
];

export const ACTIVITY_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  SELESAI: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  SEDANG_BERLANGSUNG: {
    label: 'Sedang Berlangsung',
    className: 'bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  AKAN_DATANG: {
    label: 'Akan Datang',
    className: 'bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  DIBATALKAN: {
    label: 'Dibatalkan',
    className: 'bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
};

export const CONTENT_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  SELESAI: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  PROSES: {
    label: 'Proses',
    className: 'bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  TERENCANA: {
    label: 'Terencana',
    className: 'bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
};

export const LOAN_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DIKEMBALIKAN: {
    label: 'Dikembalikan',
    className: 'bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  DIPINJAM: {
    label: 'Dipinjam',
    className: 'bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-full text-xs',
  },
  TERLAMBAT: {
    label: 'Terlambat',
    className: 'bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-xs',
  },
};
