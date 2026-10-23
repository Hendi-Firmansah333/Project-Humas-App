import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'activity' | 'content' | 'loan' | 'user';
}

export default function StatusBadge({ status, type = 'activity' }: StatusBadgeProps) {
  let badgeClass = 'bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
  let label = status;

  const upper = (status || '').toUpperCase().replace(/\s+/g, '_');

  switch (upper) {
    case 'MENUNGGU_VERIFIKASI_ADMIN':
      badgeClass = 'bg-orange-100 text-orange-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Verifikasi';
      break;
    case 'MENUNGGU_PERSETUJUAN':
    case 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS':
      badgeClass = 'bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Persetujuan';
      break;
    case 'DISETUJUI':
    case 'APPROVED':
    case 'TERJADWAL':
      badgeClass = 'bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'TERJADWAL' ? 'Terjadwal' : 'Disetujui';
      break;
    case 'DITOLAK':
    case 'REJECTED':
      badgeClass = 'bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Ditolak';
      break;
    case 'DITUGASKAN':
      badgeClass = 'bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Ditugaskan';
      break;
    case 'SEDANG_DIKERJAKAN':
    case 'SEDANG_BERLANGSUNG':
    case 'BERLANGSUNG':
      badgeClass = 'bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'SEDANG_DIKERJAKAN' ? 'Sedang Dikerjakan' : 'Sedang Berlangsung';
      break;
    case 'SIAP_DIREVIEW':
      badgeClass = 'bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Siap Direview';
      break;
    case 'MENUNGGU':
    case 'MENUNGGU_REVIEW':
      badgeClass = 'bg-purple-100 text-purple-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Review';
      break;
    case 'MENUNGGU_VERIFIKASI':
    case 'MENUNGGU_VALIDASI':
      badgeClass = 'bg-orange-100 text-orange-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Verifikasi';
      break;
    case 'MENUNGGU_PERSETUJUAN_AKHIR':
      badgeClass = 'bg-purple-100 text-purple-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Persetujuan Akhir';
      break;
    case 'SUDAH_TAYANG':
    case 'SELESAI':
    case 'PUBLISHED':
    case 'SUCCESS':
      badgeClass = 'bg-teal-100 text-teal-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'SUDAH_TAYANG' ? 'Sudah Tayang' : upper === 'PUBLISHED' ? 'Published' : 'Selesai';
      break;
    case 'PROSES':
      badgeClass = 'bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Sedang Dikerjakan';
      break;
    case 'PERLU_PERBAIKAN':
    case 'PERLU_DIPERBAIKI':
    case 'PERLU_REVISI':
    case 'DIKEMBALIKAN':
    case 'REVISI':
    case 'REVISION':
      badgeClass = 'bg-rose-100 text-rose-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'PERLU_PERBAIKAN' ? 'Perlu Perbaikan' : upper === 'PERLU_DIPERBAIKI' ? 'Perlu Diperbaiki' : upper === 'PERLU_REVISI' ? 'Perlu Revisi' : 'Dikembalikan / Revisi';
      break;
    case 'MENUNGGU_PELAKSANAAN':
    case 'AKAN_DATANG':
      badgeClass = 'bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'MENUNGGU_PELAKSANAAN' ? 'Menunggu Pelaksanaan' : 'Akan Datang';
      break;
    case 'DRAFT':
      badgeClass = 'bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Draft';
      break;
    case 'DIPINJAM':
    case 'SEDANG_DIPINJAM':
      badgeClass = 'bg-sky-100 text-sky-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Sedang Dipinjam';
      break;
    case 'TERLAMBAT':
    case 'MISSED':
    case 'DIBATALKAN':
      badgeClass = 'bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'DIBATALKAN' ? 'Dibatalkan' : upper === 'MISSED' ? 'Missed' : 'Terlambat';
      break;
    case 'AKTIF':
      badgeClass = 'bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Aktif';
      break;
    case 'NONAKTIF':
      badgeClass = 'bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Nonaktif';
      break;
  }

  return <span className={badgeClass}>{label}</span>;
}
