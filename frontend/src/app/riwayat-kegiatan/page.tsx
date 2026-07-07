'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  PaginationBar,
  CustomButton,
  CustomModal,
  CustomDrawer,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import { Eye, RotateCcw, Trash2, MapPin, Calendar, Clock, User as UserIcon, AlertTriangle, ExternalLink } from 'lucide-react';
import { Activity } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { activityService } from '@/services';

export default function ActivityHistoryPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Drawer State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await activityService.getHistory({ page: 1, pageSize: 200 });
      setActivities(result.items ?? []);
    } catch {
      toast.error('Gagal memuat riwayat kegiatan.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenDetail = (activity: Activity) => {
    router.push(`/kegiatan/${activity.id}`);
  };

  const handleOpenDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteOpen(true);
  };

  const handleRestore = async (activity: Activity) => {
    try {
      await activityService.restore(activity.id);
      toast.success(`Kegiatan "${activity.title}" berhasil diaktifkan kembali!`);
      await loadHistory();
    } catch {
      toast.error('Gagal mengaktifkan kembali kegiatan.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity) return;
    try {
      await activityService.remove(selectedActivity.id);
      setIsDeleteOpen(false);
      toast.success(`Kegiatan "${selectedActivity.title}" berhasil dihapus secara permanen.`);
      await loadHistory();
    } catch {
      toast.error('Gagal menghapus kegiatan.');
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? act.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const columns: Column<Activity>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => (
        <span className="font-semibold text-slate-600">
          {(currentPage - 1) * itemsPerPage + idx + 1}
        </span>
      ),
      className: 'w-12 text-center',
    },
    {
      key: 'title',
      header: 'Nama Kegiatan',
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{item.category}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal & Waktu',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.date)}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.startTime} - {item.endTime} WIB
          </p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC',
      render: (item) => (
        <span className="font-medium text-slate-700 text-xs">{item.pic?.fullName ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1 justify-center">
          <button
            onClick={() => handleOpenDetail(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRestore(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            title="Aktifkan Kembali"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Hapus Permanen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-center w-28',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Riwayat Kegiatan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Riwayat Kegiatan">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Riwayat Kegiatan Kehumasan</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kegiatan yang telah selesai atau dibatalkan. Kegiatan aktif tersedia di menu Kegiatan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SearchBox
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Cari kegiatan, lokasi, kategori, atau PIC..."
            className="w-full sm:w-80"
          />
          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'SELESAI', label: 'Selesai' },
              { value: 'DIBATALKAN', label: 'Dibatalkan' },
            ]}
            placeholder="Semua Status"
          />
        </div>

        <DataTable columns={columns} data={paginatedActivities} emptyMessage="Belum ada riwayat kegiatan." />

        {totalPages > 1 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredActivities.length}
            onPageChange={setCurrentPage}
            itemName="kegiatan"
          />
        )}
      </div>

      {/* View Detail Drawer */}
      <CustomDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Riwayat Kegiatan"
        subtitle={selectedActivity ? `ID: #${selectedActivity.id}` : ''}
      >
        {selectedActivity && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
                  {selectedActivity.category}
                </span>
                <StatusBadge status={selectedActivity.status} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedActivity.title}</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Tanggal: </span>
                  <span>{formatDateID(selectedActivity.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Waktu Pelaksanaan: </span>
                  <span>
                    {selectedActivity.startTime} - {selectedActivity.endTime} WIB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Lokasi: </span>
                  <span>{selectedActivity.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <UserIcon className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">PIC Bertugas: </span>
                  <span>{selectedActivity.pic?.fullName ?? '-'} ({selectedActivity.pic?.roleLabel ?? ''})</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Deskripsi & Catatan Tugas
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {selectedActivity.description || 'Tidak ada catatan tambahan untuk kegiatan ini.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Penugasan Job Desk
              </h4>
              {(selectedActivity.members ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(selectedActivity.members ?? []).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{m.user.fullName}</span>
                      <span className="bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded-lg">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada penugasan anggota.</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Dokumentasi dari Tim
              </h4>
              {(() => {
                const docLinks = (selectedActivity.media ?? []).filter(
                  (m) => m.fileType === 'application/link',
                );
                if (docLinks.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic">
                      Belum ada dokumentasi yang dikirim tim.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {docLinks.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {doc.uploader?.fullName ?? 'Tim Lapangan'}
                          </p>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline truncate block max-w-[220px]"
                          >
                            {doc.fileUrl}
                          </a>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                          title="Buka Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-2">
              <CustomButton
                variant="primary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setIsDetailOpen(false);
                  handleRestore(selectedActivity);
                }}
              >
                Aktifkan Kembali
              </CustomButton>
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomDrawer>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Riwayat Kegiatan"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Hapus &quot;{selectedActivity?.title}&quot;?
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tindakan ini akan menghapus riwayat kegiatan secara permanen dari database.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteConfirm}>
              Ya, Hapus
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}