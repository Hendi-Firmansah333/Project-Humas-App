'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
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
  Eye,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { EquipmentLoan } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { loanService } from '@/services';

export default function EquipmentLoanHistoryPage() {
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedLoan, setSelectedLoan] = useState<EquipmentLoan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await loanService.getHistory();
      setLoans(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat riwayat peminjaman.');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredLoans = loans.filter((item) => {
    const matchStatus = item.status === 'SELESAI';
    const matchSearch =
      (item.equipmentName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.borrowerName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.borrowerPhone ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleRestore = async (item: EquipmentLoan) => {
    try {
      await loanService.restore(item.id);
      toast.success(`Peminjaman "${item.equipmentName}" berhasil diaktifkan kembali!`);
      await loadHistory();
    } catch {
      toast.error('Gagal mengaktifkan kembali peminjaman.');
    }
  };

  const handleOpenDelete = (item: EquipmentLoan) => {
    setSelectedLoan(item);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLoan) return;
    try {
      await loanService.remove(selectedLoan.id);
      setIsDeleteOpen(false);
      toast.success(`Riwayat peminjaman "${selectedLoan.equipmentName}" berhasil dihapus.`);
      await loadHistory();
    } catch {
      toast.error('Gagal menghapus riwayat peminjaman.');
    }
  };

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
      header: 'Nomor HP',
      render: (item) => <span className="text-slate-600 text-xs">{item.borrowerPhone}</span>,
    },
    {
      key: 'equipmentName',
      header: 'Barang Dipinjam',
      render: (item) => <span className="font-medium text-slate-800 text-xs">{item.equipmentName}</span>,
    },
    {
      key: 'borrowDate',
      header: 'Tanggal Pinjam',
      render: (item) => (
        <span className="text-slate-600 text-xs">{formatDateID(item.borrowDate.split('T')[0])}</span>
      ),
    },
    {
      key: 'returnDate',
      header: 'Batas Kembali',
      render: (item) => (
        <span className="text-slate-600 text-xs">{formatDateID(item.returnDate.split('T')[0])}</span>
      ),
    },
    {
      key: 'actualReturnDate',
      header: 'Dikembalikan Pada',
      render: (item) => (
        <span className="text-emerald-700 font-medium text-xs">
          {item.actualReturnDate ? formatDateID(item.actualReturnDate.split('T')[0]) : '-'}
        </span>
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
            onClick={() => {
              setSelectedLoan(item);
              setIsDetailOpen(true);
            }}
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            title="Hapus Permanen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-28 text-center',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Riwayat Peminjaman Inventaris">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Riwayat Peminjaman Inventaris">
      {/* Header Banner & Table Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Riwayat Pengembalian Inventaris</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar peminjaman barang dan alat multimedia yang telah selesai dikembalikan.
          </p>
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
        </div>
      </div>

      {/* Loan History Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-6">
        <DataTable columns={columns} data={paginatedLoans} emptyMessage="Tidak ada riwayat peminjaman." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredLoans.length}
          onPageChange={setCurrentPage}
          itemName="riwayat"
        />
      </div>

      {/* Detail Loan Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Peminjaman Selesai"
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
              <p className="text-emerald-700 font-semibold">
                <strong>Tanggal Dikembalikan:</strong> {selectedLoan.actualReturnDate ? formatDateID(selectedLoan.actualReturnDate.split('T')[0]) : '-'}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Riwayat Peminjaman"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Hapus riwayat &quot;{selectedLoan?.equipmentName}&quot;?
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tindakan ini akan menghapus riwayat peminjaman secara permanen dari database.
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
