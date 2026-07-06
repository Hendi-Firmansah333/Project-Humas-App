import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'activity' | 'content' | 'loan' | 'user';
}

export default function StatusBadge({ status, type = 'activity' }: StatusBadgeProps) {
  let badgeClass = 'bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full text-xs';
  let label = status;

  const upper = status.toUpperCase().replace(/\s+/g, '_');

  if (upper === 'SELESAI' || upper === 'SUCCESS' || upper === 'DIKEMBALIKAN' || upper === 'AKTIF' || upper === 'DISETUJUI' || upper === 'APPROVED') {
    badgeClass = 'bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
    label = status === 'AKTIF' ? 'Aktif' : status === 'DIKEMBALIKAN' ? 'Dikembalikan' : (upper === 'DISETUJUI' || upper === 'APPROVED') ? 'Disetujui' : 'Selesai';
  } else if (upper === 'SEDANG_BERLANGSUNG' || upper === 'BERLANGSUNG' || upper === 'DIPINJAM' || upper === 'SEDANG_DIPINJAM' || upper === 'TERENCANA' || upper === 'REVISI' || upper === 'REVISION') {
    badgeClass = 'bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
    label = (status === 'DIPINJAM' || upper === 'SEDANG_DIPINJAM') ? 'Sedang Dipinjam' : status === 'TERENCANA' ? 'Terencana' : (upper === 'REVISI' || upper === 'REVISION') ? 'Perlu Revisi' : 'Sedang Berlangsung';
  } else if (upper === 'AKAN_DATANG' || upper === 'PROSES' || upper === 'MENUNGGU_REVIEW' || upper === 'REVIEW') {
    badgeClass = 'bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
    label = status === 'PROSES' ? 'Proses' : (upper === 'MENUNGGU_REVIEW' || upper === 'REVIEW') ? 'Menunggu Review' : 'Akan Datang';
  } else if (upper === 'TERLAMBAT' || upper === 'NONAKTIF' || upper === 'MISSED' || upper === 'DITOLAK' || upper === 'REJECTED') {
    badgeClass = 'bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
    label = status === 'NONAKTIF' ? 'Nonaktif' : status === 'MISSED' ? 'Missed' : (upper === 'DITOLAK' || upper === 'REJECTED') ? 'Ditolak' : 'Terlambat';
  }

  return <span className={badgeClass}>{label}</span>;
}
