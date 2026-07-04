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
  UserAvatar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Plus,
  Eye,
  CheckSquare,
  Camera,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  RotateCcw,
} from 'lucide-react';
import { EquipmentLoan, LoanStatus } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';

const initialLoans: EquipmentLoan[] = [
  {
    id: 1,
    equipmentId: 101,
    borrowerId: 3,
    borrowDate: '2025-05-20T08:00:00',
    returnDate: '2025-05-22T16:00:00',
    status: 'DIPINJAM',
    equipment: {
      id: 101,
      name: 'Sony FX3 Full-Frame Cinema Camera (Unit #01)',
      totalUnits: 2,
      availableUnits: 1,
    },
    borrower: {
      id: 3,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      role: 'VIDEOGRAFER',
      roleLabel: 'Videografer Utama',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 2,
    equipmentId: 102,
    borrowerId: 4,
    borrowDate: '2025-05-19T08:30:00',
    returnDate: '2025-05-20T17:00:00',
    status: 'TERLAMBAT',
    equipment: {
      id: 102,
      name: 'Lensa Sony FE 24-70mm f/2.8 GM II (Unit #02)',
      totalUnits: 4,
      availableUnits: 2,
    },
    borrower: {
      id: 4,
      fullName: 'Andi Saputra',
      username: 'andi.s',
      email: 'andi@polinela.ac.id',
      role: 'FOTOGRAFER',
      roleLabel: 'Fotografer Resmi',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 3,
    equipmentId: 103,
    borrowerId: 2,
    borrowDate: '2025-05-21T09:00:00',
    returnDate: '2025-05-21T15:00:00',
    status: 'DIPINJAM',
    equipment: {
      id: 103,
      name: 'Microphone Wireless DJI Mic 2 Set (Unit #01)',
      totalUnits: 3,
      availableUnits: 1,
    },
    borrower: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis Lapangan',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 4,
    equipmentId: 104,
    borrowerId: 1,
    borrowDate: '2025-05-18T08:00:00',
    returnDate: '2025-05-19T14:00:00',
    status: 'DIKEMBALIKAN',
    equipment: {
      id: 104,
      name: 'Gimbal DJI RS 3 Pro Combo (Unit #01)',
      totalUnits: 2,
      availableUnits: 2,
    },
    borrower: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: 'ADMIN',
      roleLabel: 'Koordinator Humas',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 5,
    equipmentId: 105,
    borrowerId: 4,
    borrowDate: '2025-05-15T08:00:00',
    returnDate: '2025-05-16T16:00:00',
    status: 'DIKEMBALIKAN',
    equipment: {
      id: 105,
      name: 'Lampu Studio Godox SL60W LED Kit (Unit #03)',
      totalUnits: 4,
      availableUnits: 3,
    },
    borrower: {
      id: 4,
      fullName: 'Andi Saputra',
      username: 'andi.s',
      email: 'andi@polinela.ac.id',
      role: 'FOTOGRAFER',
      roleLabel: 'Fotografer Resmi',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  },
];

export default function EquipmentLoanPage() {
  const [loans, setLoans] = useState<EquipmentLoan[]>(initialLoans);
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
  const [returnCondition, setReturnCondition] = useState('NORMAL');
  const [returnNote, setReturnNote] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    equipmentName: 'Sony FX3 Full-Frame Cinema Camera (Unit #02)',
    borrowerName: 'Budi Santoso',
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date().toISOString().split('T')[0],
    purpose: 'Peliputan Kegiatan Kunjungan Rektorat',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredLoans = loans.filter((item) => {
    const matchSearch =
      item.equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.borrower.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoan: EquipmentLoan = {
      id: Date.now(),
      equipmentId: 106,
      borrowerId: 3,
      borrowDate: `${formData.borrowDate}T08:00:00`,
      returnDate: `${formData.returnDate}T16:00:00`,
      status: 'DIPINJAM',
      equipment: {
        id: 106,
        name: formData.equipmentName,
        totalUnits: 2,
        availableUnits: 1,
      },
      borrower: {
        id: 3,
        fullName: formData.borrowerName,
        username: formData.borrowerName.toLowerCase().replace(/\s+/g, '.'),
        email: `${formData.borrowerName.toLowerCase().replace(/\s+/g, '')}@polinela.ac.id`,
        role: 'VIDEOGRAFER',
        roleLabel: 'Petugas Humas',
        status: 'AKTIF',
        joinedAt: '2025-01-01',
      },
    };

    setLoans([newLoan, ...loans]);
    setIsCreateOpen(false);
    toast.success('Pengajuan peminjaman alat berhasil dicatat!');
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setLoans(
      loans.map((l) => (l.id === selectedLoan.id ? { ...l, status: 'DIKEMBALIKAN' as LoanStatus } : l)),
    );
    setIsReturnOpen(false);
    toast.success(
      `Alat "${selectedLoan.equipment.name}" telah tercatat DIKEMBALIKAN dengan kondisi: ${
        returnCondition === 'NORMAL' ? 'Normal / Baik' : 'Catatan Khusus'
      }.`,
    );
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
      key: 'equipment',
      header: 'Nama Alat & Kode',
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-800 leading-snug">{item.equipment.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ID Unit: #{item.equipment.id}</p>
        </div>
      ),
    },
    {
      key: 'borrower',
      header: 'Peminjam (Borrower)',
      render: (item) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <UserAvatar src={item.borrower.avatar} name={item.borrower.fullName} size="sm" />
          <div>
            <p className="font-medium text-slate-700 text-xs">{item.borrower.fullName}</p>
            <p className="text-[10px] text-slate-400">{item.borrower.roleLabel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'borrowDate',
      header: 'Tanggal Pinjam',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.borrowDate.split('T')[0])}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.borrowDate.includes('T') ? item.borrowDate.split('T')[1].substring(0, 5) : '08:00'} WIB
          </p>
        </div>
      ),
    },
    {
      key: 'returnDate',
      header: 'Batas Kembali',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.returnDate.split('T')[0])}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.returnDate.includes('T') ? item.returnDate.split('T')[1].substring(0, 5) : '16:00'} WIB
          </p>
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
          {item.status !== 'DIKEMBALIKAN' && (
            <button
              onClick={() => {
                setSelectedLoan(item);
                setIsReturnOpen(true);
              }}
              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-semibold text-xs flex items-center gap-1 cursor-pointer"
              title="Konfirmasi Pengembalian Alat"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Kembalikan</span>
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
      className: 'w-32 text-center',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Manajemen Peminjaman Alat Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Peminjaman Alat Kehumasan">
      {/* Statistics Row: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Inventaris Alat"
          value="48 Unit"
          subtitle="Kamera, Lensa, Audio, Lighting"
          icon={Camera}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Sedang Dipinjam"
          value="14 Unit"
          subtitle="4 personel bertugas di lapangan"
          icon={Clock}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Tersedia di Gudang"
          value="32 Unit"
          subtitle="Siap dipinjam peliputan"
          icon={CheckCircle2}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Terlambat Pengembalian"
          value="2 Unit"
          subtitle="Butuh follow-up segera"
          icon={AlertCircle}
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-600"
        />
      </div>

      {/* Header Banner & Table Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Peminjaman Alat & Inventaris Humas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Catat pergerakan alat multimedia, jadwal peminjaman personel, dan verifikasi pengembalian inventaris.
            </p>
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Ajukan Peminjaman
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
            placeholder="Cari nama alat, peminjam, atau kode unit..."
            className="w-full sm:w-80"
          />
          <div className="flex items-center gap-2.5">
            <FilterDropdown
              options={[
                { value: 'DIPINJAM', label: 'Sedang Dipinjam' },
                { value: 'DIKEMBALIKAN', label: 'Dikembalikan' },
                { value: 'TERLAMBAT', label: 'Terlambat Kembali' },
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
        <DataTable columns={columns} data={paginatedLoans} emptyMessage="Tidak ada data peminjaman yang cocok." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredLoans.length}
          onPageChange={setCurrentPage}
          itemName="peminjaman"
        />
      </div>

      {/* Create Loan Modal */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Ajukan Peminjaman Alat Baru"
        subtitle="Formulir peminjaman inventaris kehumasan untuk peliputan."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Inventaris Alat *</label>
            <select
              value={formData.equipmentName}
              onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            >
              <option value="Sony FX3 Full-Frame Cinema Camera (Unit #02)">Sony FX3 Cinema Camera (Unit #02)</option>
              <option value="Lensa Sony FE 70-200mm f/2.8 GM (Unit #01)">Lensa Sony FE 70-200mm f/2.8 GM (Unit #01)</option>
              <option value="Drone DJI Mavic 3 Cine Combo (Unit #01)">Drone DJI Mavic 3 Cine Combo (Unit #01)</option>
              <option value="Microphone Rode Wireless GO II (Unit #02)">Microphone Rode Wireless GO II (Unit #02)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Personel Peminjam *</label>
              <select
                value={formData.borrowerName}
                onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Budi Santoso">Budi Santoso (Videografer)</option>
                <option value="Komang Ari">Komang Ari (Koordinator)</option>
                <option value="Rina Wati">Rina Wati (Jurnalis)</option>
                <option value="Andi Saputra">Andi Saputra (Fotografer)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keperluan Peliputan</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengambilan *</label>
              <input
                type="date"
                required
                value={formData.borrowDate}
                onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rencana Pengembalian *</label>
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
              Proses Peminjaman
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Return Confirmation Dialog */}
      <CustomModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Verifikasi Pengembalian Alat"
        subtitle={selectedLoan ? `Alat: ${selectedLoan.equipment.name}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{selectedLoan?.borrower.fullName}</p>
              <p className="text-slate-500">Tanggal Pinjam: {selectedLoan?.borrowDate.split('T')[0]}</p>
            </div>
            <StatusBadge status={selectedLoan?.status || 'DIPINJAM'} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kondisi Fisik & Fungsi Alat *</label>
            <select
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            >
              <option value="NORMAL">Normal / Lengkap Beserta Aksesori</option>
              <option value="DAMAGED">Ada Catatan Goresan / Kerusakan Kecil</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Pemeriksaan</label>
            <textarea
              rows={2}
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Tuliskan catatan kelengkapan baterai, memori card, atau strap..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsReturnOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Konfirmasi Kembali
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Detail Loan Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Inventaris & Peminjaman"
        maxWidth="sm"
      >
        {selectedLoan && (
          <div className="space-y-4 text-xs">
            <div>
              <StatusBadge status={selectedLoan.status} />
              <h4 className="font-bold text-sm text-slate-900 mt-2">{selectedLoan.equipment.name}</h4>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
              <p><strong>Peminjam:</strong> {selectedLoan.borrower.fullName} ({selectedLoan.borrower.roleLabel})</p>
              <p><strong>Waktu Pinjam:</strong> {formatDateID(selectedLoan.borrowDate.split('T')[0])}</p>
              <p><strong>Batas Kembali:</strong> {formatDateID(selectedLoan.returnDate.split('T')[0])}</p>
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
