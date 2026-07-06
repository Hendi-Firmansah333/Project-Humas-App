'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  CustomButton,
  CustomModal,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Plus,
  Eye,
  CheckSquare,
  Package,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { EquipmentLoan } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { loanService } from '@/services';

export default function EquipmentLoanPage() {
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EquipmentLoan | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    borrowerName: '',
    borrowerPhone: '',
    equipmentName: '',
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date().toISOString().split('T')[0],
    purpose: '',
  });

  const loadLoans = async () => {
    try {
      const data = await loanService.getAll();
      setLoans(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data pencatatan inventaris.');
      setLoans([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadLoans();
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      borrowerName: '',
      borrowerPhone: '',
      equipmentName: '',
      borrowDate: new Date().toISOString().split('T')[0],
      returnDate: new Date().toISOString().split('T')[0],
      purpose: '',
    });
    setIsCreateOpen(true);
  };

  const filteredLoans = loans.filter((item) => {
    const matchSearch =
      (item.equipmentName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.borrowerName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.borrowerPhone ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.borrowerName || !formData.borrowerPhone || !formData.equipmentName || !formData.borrowDate || !formData.returnDate || !formData.purpose) {
      toast.error('Harap lengkapi semua field yang wajib diisi!');
      return;
    }

    if (!/^\d+$/.test(formData.borrowerPhone)) {
      toast.error('Nomor telepon hanya boleh berisi angka!');
      return;
    }

    if (new Date(formData.returnDate) < new Date(formData.borrowDate)) {
      toast.error('Tanggal pengembalian tidak boleh lebih kecil dari tanggal pinjam!');
      return;
    }

    try {
      await loanService.create({
        borrowerName: formData.borrowerName,
        borrowerPhone: formData.borrowerPhone,
        equipmentName: formData.equipmentName,
        borrowDate: `${formData.borrowDate}T08:00:00`,
        returnDate: `${formData.returnDate}T16:00:00`,
        purpose: formData.purpose,
      });
      setIsCreateOpen(false);
      toast.success('Pencatatan inventaris berhasil ditambahkan!');
      await loadLoans();
    } catch {
      toast.error('Gagal menyimpan pencatatan ke server.');
    }
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await loanService.verifyReturn(selectedLoan.id);
      setIsReturnOpen(false);
      toast.success(
        `Barang "${selectedLoan.equipmentName}" telah tercatat SELESAI dikembalikan.`
      );
      await loadLoans();
    } catch {
      toast.error('Gagal memverifikasi pengembalian alat.');
    }
  };

  const activeLoanCount = loans.filter((l) => l.status === 'SEDANG_DIPINJAM').length;
  const overdueLoanCount = loans.filter((l) => l.status === 'TERLAMBAT').length;
  const returnedLoanCount = loans.filter((l) => l.status === 'SELESAI').length;

  const columns: Column<EquipmentLoan>[] = [
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
      key: 'borrowerName',
      header: 'Nama Peminjam',
      render: (item) => (
        <span className="font-semibold text-slate-800">{item.borrowerName}</span>
      ),
    },
    {
      key: 'borrowerPhone',
      header: 'Nomor Telepon',
      render: (item) => <span className="text-slate-600 text-sm">{item.borrowerPhone}</span>,
    },
    {
      key: 'equipmentName',
      header: 'Barang Dipinjam',
      render: (item) => <span className="font-medium text-slate-800 text-sm">{item.equipmentName}</span>,
    },
    {
      key: 'purpose',
      header: 'Keperluan',
      render: (item) => (
        <span className="text-slate-500 text-xs truncate max-w-[150px] inline-block" title={item.purpose}>
          {item.purpose || '-'}
        </span>
      ),
    },
    {
      key: 'borrowDate',
      header: 'Tanggal Pinjam',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.borrowDate.split('T')[0])}</p>
        </div>
      ),
    },
    {
      key: 'returnDate',
      header: 'Tanggal Kembali',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.returnDate.split('T')[0])}</p>
        </div>
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
        <div className="flex items-center gap-1.5">
          {item.status !== 'SELESAI' && (
            <button
              onClick={() => {
                setSelectedLoan(item);
                setIsReturnOpen(true);
              }}
              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-semibold text-xs flex items-center gap-1 cursor-pointer"
              title="Selesaikan Peminjaman"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setSelectedLoan(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Lihat Detail Peminjaman"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-24 text-center',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Pencatatan Inventaris Humas">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pencatatan Inventaris Humas">
      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Peminjaman"
          value={`${loans.length} Data`}
          subtitle="Keseluruhan catatan"
          icon={Package}
          iconBgClass="bg-indigo-50"
          iconColorClass="text-indigo-600"
        />
        <StatCard
          title="Sedang Dipinjam"
          value={`${activeLoanCount} Aktif`}
          subtitle="Peminjaman sedang berlangsung"
          icon={Clock}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Selesai Dikembalikan"
          value={`${returnedLoanCount} Selesai`}
          subtitle="Peminjaman telah selesai"
          icon={CalendarDays}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Terlambat"
          value={`${overdueLoanCount} Peminjaman`}
          subtitle="Melewati batas kembali"
          icon={AlertCircle}
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-600"
        />
      </div>

      {/* Header Banner & Table Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Pencatatan Inventaris</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Catat pergerakan alat multimedia dan jadwal peminjaman oleh admin humas.
            </p>
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Tambah Catatan Peminjaman
          </CustomButton>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SearchBox
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Cari nama peminjam, barang, atau no telepon..."
            className="w-full sm:w-80"
          />
          <div className="flex items-center gap-2.5">
            <FilterDropdown
              options={[
                { value: 'SEDANG_DIPINJAM', label: 'Sedang Dipinjam' },
                { value: 'SELESAI', label: 'Selesai' },
                { value: 'TERLAMBAT', label: 'Terlambat' },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Status"
            />
          </div>
        </div>
      </div>

      {/* Loan Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable columns={columns} data={paginatedLoans} emptyMessage="Tidak ada data pencatatan inventaris yang cocok." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredLoans.length}
          onPageChange={setCurrentPage}
          itemName="catatan"
        />
      </div>

      {/* Create Loan Modal */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Pencatatan Peminjaman"
        subtitle="Masukkan detail peminjam dan barang yang dipinjam."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Peminjam *</label>
              <input
                type="text"
                required
                placeholder="Cth: Budi Santoso"
                value={formData.borrowerName}
                onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Telepon *</label>
              <input
                type="text"
                required
                placeholder="Cth: 081234567890"
                value={formData.borrowerPhone}
                onChange={(e) => setFormData({ ...formData, borrowerPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Barang Yang Dipinjam *</label>
            <input
              type="text"
              required
              placeholder="Cth: Kamera Sony A7III, Tripod, Drone"
              value={formData.equipmentName}
              onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keperluan Peminjaman *</label>
            <textarea
              rows={3}
              required
              placeholder="Cth: Liputan Acara Wisuda"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Peminjaman *</label>
              <input
                type="date"
                required
                value={formData.borrowDate}
                onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengembalian *</label>
              <input
                type="date"
                required
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Pencatatan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Return Confirmation Dialog */}
      <CustomModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Verifikasi Pengembalian Alat"
        subtitle={selectedLoan ? `Peminjam: ${selectedLoan.borrowerName}` : ''}
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
            <p className="font-bold text-slate-800 text-sm">{selectedLoan?.equipmentName}</p>
            <p className="text-slate-500">Tanggal Pinjam: {selectedLoan?.borrowDate.split('T')[0]}</p>
            <p className="text-slate-500">Tanggal Kembali: {selectedLoan?.returnDate.split('T')[0]}</p>
          </div>
          
          <p className="text-sm text-slate-600">
            Apakah Anda yakin barang ini telah dikembalikan dan selesai dipinjam?
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsReturnOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Konfirmasi Selesai
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Detail Loan Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Pencatatan Peminjaman"
        maxWidth="sm"
      >
        {selectedLoan && (
          <div className="space-y-4 text-xs">
            <div>
              <StatusBadge status={selectedLoan.status} />
              <h4 className="font-bold text-sm text-slate-900 mt-2">{selectedLoan.equipmentName}</h4>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
              <p><strong>Peminjam:</strong> {selectedLoan.borrowerName}</p>
              <p><strong>Nomor HP:</strong> {selectedLoan.borrowerPhone}</p>
              <p><strong>Keperluan:</strong> {selectedLoan.purpose}</p>
              <p><strong>Tanggal Pinjam:</strong> {formatDateID(selectedLoan.borrowDate.split('T')[0])}</p>
              <p><strong>Batas Kembali:</strong> {formatDateID(selectedLoan.returnDate.split('T')[0])}</p>
              {selectedLoan.actualReturnDate && (
                <p><strong>Tanggal Dikembalikan:</strong> {formatDateID(selectedLoan.actualReturnDate.split('T')[0])}</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
