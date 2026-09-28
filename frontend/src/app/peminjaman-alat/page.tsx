'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Plus,
  Eye,
  Package,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit,
  History,
  Archive,
  CheckCircle,
  Wrench,
  XCircle,
} from 'lucide-react';
import { EquipmentLoan, Equipment } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { loanService, activityService } from '@/services';
import { getStoredUser } from '@/utils/session';

// ─── Type Extensions ─────────────────────────────────────────────────────────
interface EquipmentWithStock extends Equipment {
  total: number;
  borrowed: number;
  broken: number;
  available: number;
}

interface LoanWithOverdue extends EquipmentLoan {
  overdueDays?: number;
}

// ─── Tab Definition ───────────────────────────────────────────────────────────
type Tab = 'inventaris' | 'peminjaman' | 'riwayat';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'inventaris', label: 'Inventaris Alat', icon: Package },
  { id: 'peminjaman', label: 'Peminjaman Aktif & Terlambat', icon: Clock },
  { id: 'riwayat', label: 'Riwayat Peminjaman', icon: History },
];

const CONDITION_LABELS: Record<string, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat',
  HILANG: 'Hilang',
};

const RETURN_CONDITION_OPTIONS = [
  { value: 'BAIK', label: 'Baik (kembali ke stok)' },
  { value: 'RUSAK_RINGAN', label: 'Rusak Ringan (masuk stok rusak)' },
  { value: 'RUSAK_BERAT', label: 'Rusak Berat (masuk stok rusak)' },
  { value: 'HILANG', label: 'Hilang (masuk stok rusak)' },
];

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PeminjamanAlatPage() {
  const user = getStoredUser();
  const role = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<Tab>('inventaris');
  const [loading, setLoading] = useState(true);

  // Inventaris state
  const [equipment, setEquipment] = useState<EquipmentWithStock[]>([]);
  const [eqSearch, setEqSearch] = useState('');
  const [eqCategoryFilter, setEqCategoryFilter] = useState('');
  const [isEqCreateOpen, setIsEqCreateOpen] = useState(false);
  const [isEqEditOpen, setIsEqEditOpen] = useState(false);
  const [isEqDeleteOpen, setIsEqDeleteOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithStock | null>(null);
  const [eqForm, setEqForm] = useState({
    name: '', code: '', category: 'Kamera & Audio', brand: '', serialNumber: '',
    total: 1, storage: '', condition: 'BAIK', description: '', status: 'AKTIF',
  });

  // Peminjaman state
  const [loans, setLoans] = useState<LoanWithOverdue[]>([]);
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');
  const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoanDeleteOpen, setIsLoanDeleteOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithOverdue | null>(null);

  // Create loan form
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | undefined>(undefined);
  const [activitiesList, setActivitiesList] = useState<{ id: number; title: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ equipmentId: number; quantity: number }[]>([]);

  // Return form
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnConditions, setReturnConditions] = useState<Record<number, string>>({});

  // Riwayat state
  const [history, setHistory] = useState<LoanWithOverdue[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const loadEquipment = useCallback(async () => {
    try {
      const data = await loanService.getEquipment({ includeInactive: isAdmin });
      setEquipment(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data inventaris.');
    }
  }, [isAdmin]);

  const loadLoans = useCallback(async () => {
    try {
      const data = await loanService.getAll();
      setLoans(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data peminjaman aktif.');
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await loanService.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat riwayat peminjaman.');
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      const res = await activityService.getAll();
      if (res && Array.isArray(res.items)) {
        setActivitiesList(res.items.map((a) => ({ id: a.id, title: a.title })));
      }
    } catch {
      // optional load
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadEquipment(), loadLoans(), loadHistory(), loadActivities()]);
      setLoading(false);
    };
    init();
  }, [loadEquipment, loadLoans, loadHistory, loadActivities]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getEquipmentNames = (loan: EquipmentLoan) => {
    if (loan.items && loan.items.length > 0) {
      return loan.items.map((i) => `${i.equipment?.name ?? 'Alat'} x${i.quantity}`).join(', ');
    }
    return (loan as any).equipmentName ?? '-';
  };

  const uniqueCategories = Array.from(new Set(equipment.map((e) => e.category))).filter(Boolean);

  // ─── Inventaris handlers ─────────────────────────────────────────────────────

  const handleOpenCreateEq = () => {
    setEqForm({ name: '', code: '', category: 'Kamera & Audio', brand: '', serialNumber: '', total: 1, storage: '', condition: 'BAIK', description: '', status: 'AKTIF' });
    setIsEqCreateOpen(true);
  };

  const handleOpenEditEq = (eq: EquipmentWithStock) => {
    setSelectedEquipment(eq);
    setEqForm({
      name: eq.name, code: eq.code, category: eq.category, brand: (eq as any).brand ?? '',
      serialNumber: (eq as any).serialNumber ?? '', total: eq.total, storage: eq.storage ?? '',
      condition: eq.condition ?? 'BAIK', description: eq.description ?? '', status: eq.status ?? 'AKTIF',
    });
    setIsEqEditOpen(true);
  };

  const handleCreateEqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqForm.name || !eqForm.code) { toast.error('Nama dan kode alat wajib diisi!'); return; }
    setIsSubmitting(true);
    try {
      await loanService.createEquipment(eqForm as any);
      toast.success(`Alat "${eqForm.name}" berhasil ditambahkan ke inventaris!`);
      setIsEqCreateOpen(false);
      await loadEquipment();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal menambahkan alat.');
    } finally { setIsSubmitting(false); }
  };

  const handleEditEqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    setIsSubmitting(true);
    try {
      await loanService.updateEquipment(selectedEquipment.id, eqForm as any);
      toast.success('Data inventaris berhasil diperbarui!');
      setIsEqEditOpen(false);
      await loadEquipment();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal memperbarui inventaris.');
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteEq = async () => {
    if (!selectedEquipment) return;
    setIsSubmitting(true);
    try {
      await loanService.removeEquipment(selectedEquipment.id);
      toast.success(`Alat "${selectedEquipment.name}" dihapus dari inventaris.`);
      setIsEqDeleteOpen(false);
      await loadEquipment();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal menghapus alat.');
    } finally { setIsSubmitting(false); }
  };

  // ─── Peminjaman handlers ─────────────────────────────────────────────────────

  const handleOpenCreateLoan = () => {
    const u = getStoredUser();
    setBorrowerName(isAdmin ? '' : (u?.fullName ?? ''));
    setBorrowerPhone(isAdmin ? '' : (u?.phone ?? ''));
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setPurpose('');
    setSelectedActivityId(undefined);
    setSelectedItems([]);
    setIsCreateLoanOpen(true);
  };

  const handleAddItem = (equipmentId: number) => {
    const existing = selectedItems.find((i) => i.equipmentId === equipmentId);
    const eq = equipment.find((e) => e.id === equipmentId);
    if (!eq) return;
    if (existing) {
      if (existing.quantity >= eq.available) { toast.warning(`Stok ${eq.name} hanya ${eq.available} unit.`); return; }
      setSelectedItems(selectedItems.map((i) => i.equipmentId === equipmentId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (eq.available < 1) { toast.warning(`Stok ${eq.name} sedang habis.`); return; }
      setSelectedItems([...selectedItems, { equipmentId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (equipmentId: number) => setSelectedItems(selectedItems.filter((i) => i.equipmentId !== equipmentId));

  const handleUpdateItemQty = (equipmentId: number, qty: number) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    if (!eq) return;
    if (qty > eq.available) { toast.warning(`Stok tersedia hanya ${eq.available}.`); return; }
    if (qty < 1) { handleRemoveItem(equipmentId); return; }
    setSelectedItems(selectedItems.map((i) => i.equipmentId === equipmentId ? { ...i, quantity: qty } : i));
  };

  const handleCreateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName || !borrowerPhone || !borrowDate || !returnDate || !purpose) { toast.error('Harap lengkapi semua informasi peminjam!'); return; }
    if (selectedItems.length === 0) { toast.error('Pilih minimal satu peralatan!'); return; }
    if (!/^\d+$/.test(borrowerPhone)) { toast.error('Nomor telepon hanya boleh berisi angka!'); return; }
    if (new Date(returnDate) < new Date(borrowDate)) { toast.error('Tanggal pengembalian tidak boleh lebih kecil dari tanggal pinjam!'); return; }
    setIsSubmitting(true);
    try {
      await loanService.create({
        borrowerName,
        borrowerPhone,
        borrowDate: `${borrowDate}T08:00:00Z`,
        returnDate: `${returnDate}T16:00:00Z`,
        purpose,
        activityId: selectedActivityId || undefined,
        items: selectedItems,
      });
      setIsCreateLoanOpen(false);
      toast.success('Peminjaman inventaris berhasil dicatat!');
      await Promise.all([loadLoans(), loadEquipment()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal menyimpan peminjaman.');
    } finally { setIsSubmitting(false); }
  };

  const handleOpenReturn = (loan: LoanWithOverdue) => {
    setSelectedLoan(loan);
    const initQty: Record<number, number> = {};
    const initCond: Record<number, string> = {};
    loan.items?.forEach((item) => {
      const remaining = item.quantity - item.returnedQuantity;
      initQty[item.id] = remaining;
      initCond[item.id] = 'BAIK';
    });
    setReturnQuantities(initQty);
    setReturnConditions(initCond);
    setIsReturnOpen(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const payload = Object.entries(returnQuantities)
      .map(([idStr, qty]) => ({ loanItemId: Number(idStr), returnedQuantity: Number(qty), returnCondition: returnConditions[Number(idStr)] ?? 'BAIK' }))
      .filter((i) => i.returnedQuantity > 0);
    if (payload.length === 0) { toast.warning('Pilih minimal satu alat untuk dikembalikan.'); return; }
    setIsSubmitting(true);
    try {
      await loanService.returnItems(selectedLoan.id, payload);
      setIsReturnOpen(false);
      toast.success('Pengembalian alat berhasil diproses!');
      await Promise.all([loadLoans(), loadEquipment(), loadHistory()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal memproses pengembalian.');
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;
    setIsSubmitting(true);
    try {
      await loanService.remove(selectedLoan.id);
      setIsLoanDeleteOpen(false);
      toast.success('Catatan peminjaman berhasil dihapus.');
      await Promise.all([loadLoans(), loadEquipment()]);
    } catch {
      toast.error('Gagal menghapus catatan peminjaman.');
    } finally { setIsSubmitting(false); }
  };

  // ─── Derived data ────────────────────────────────────────────────────────────

  const filteredEquipment = equipment.filter((eq) => {
    const matchSearch = eq.name.toLowerCase().includes(eqSearch.toLowerCase()) || eq.code.toLowerCase().includes(eqSearch.toLowerCase());
    const matchCat = eqCategoryFilter ? eq.category === eqCategoryFilter : true;
    return matchSearch && matchCat;
  });

  const filteredLoans = loans.filter((l) => {
    const matchSearch = getEquipmentNames(l).toLowerCase().includes(loanSearch.toLowerCase()) || l.borrowerName.toLowerCase().includes(loanSearch.toLowerCase());
    const matchStatus = loanStatusFilter ? l.status === loanStatusFilter : true;
    return matchSearch && matchStatus;
  });

  const filteredHistory = history.filter((l) =>
    getEquipmentNames(l).toLowerCase().includes(historySearch.toLowerCase()) || l.borrowerName.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Summary stats
  const totalEq = equipment.reduce((s, e) => s + e.total, 0);
  const availableEq = equipment.reduce((s, e) => s + e.available, 0);
  const borrowedEq = equipment.reduce((s, e) => s + e.borrowed, 0);
  const brokenEq = equipment.reduce((s, e) => s + e.broken, 0);
  const overdueCount = loans.filter((l) => l.status === 'TERLAMBAT').length;

  // ─── Column definitions ──────────────────────────────────────────────────────

  const eqColumns: Column<EquipmentWithStock>[] = [
    {
      key: 'name', header: 'Nama Alat & Kode',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{item.code}</span>
            {(item as any).brand && <span className="text-[11px] text-slate-400">{(item as any).brand}</span>}
          </div>
          {(item as any).activeAllocations && (item as any).activeAllocations.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {(item as any).activeAllocations.map((alloc: any, idx: number) => (
                <div key={idx} className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="font-bold">Kegiatan:</span>
                  <span className="truncate max-w-xs">{alloc.activityTitle} ({alloc.quantity} unit • PIC: {alloc.picName})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    { key: 'category', header: 'Kategori', render: (item) => <span className="text-xs text-slate-600 font-medium">{item.category}</span> },
    {
      key: 'stock', header: 'Stok',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="flex gap-2">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">Total: {item.total}</span>
            <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-medium text-emerald-700">Tersedia: {item.available}</span>
          </div>
          <div className="flex gap-2">
            {item.borrowed > 0 && <span className="bg-sky-100 px-1.5 py-0.5 rounded font-medium text-sky-700">Digunakan: {item.borrowed}</span>}
            {item.broken > 0 && <span className="bg-red-100 px-1.5 py-0.5 rounded font-medium text-red-700">Rusak: {item.broken}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'status_ketersediaan', header: 'Status Ketersediaan',
      render: (item) => {
        if (item.available > 0 && item.borrowed === 0) {
          return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">TERSEDIA</span>;
        }
        if (item.borrowed > 0 && item.available > 0) {
          return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">SEBAGIAN DIGUNAKAN</span>;
        }
        if (item.borrowed > 0 && item.available === 0) {
          return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">SEDANG DIGUNAKAN</span>;
        }
        if (item.broken > 0 && item.available === 0) {
          return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">RUSAK / TIDAK TERSEDIA</span>;
        }
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">NONAKTIF</span>;
      },
    },
    {
      key: 'condition', header: 'Kondisi Fisik',
      render: (item) => {
        const cond = item.condition ?? 'BAIK';
        const colors: Record<string, string> = { BAIK: 'bg-emerald-100 text-emerald-800', RUSAK_RINGAN: 'bg-amber-100 text-amber-800', RUSAK_BERAT: 'bg-red-100 text-red-800', HILANG: 'bg-gray-200 text-gray-600' };
        return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors[cond] ?? 'bg-slate-100 text-slate-600'}`}>{CONDITION_LABELS[cond] ?? cond}</span>;
      },
    },
    { key: 'storage', header: 'Lokasi Simpan', render: (item) => <span className="text-xs text-slate-500">{item.storage ?? '-'}</span> },
    {
      key: 'action', header: 'Aksi',
      render: (item) => isAdmin ? (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => handleOpenEditEq(item)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Edit"><Edit className="w-4 h-4" /></button>
          <button onClick={() => { setSelectedEquipment(item); setIsEqDeleteOpen(true); }} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ) : null,
      className: 'text-right',
    },
  ];

  const loanColumns: Column<LoanWithOverdue>[] = [
    {
      key: 'borrowerName', header: 'Peminjam',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{item.borrowerName}</p>
          <p className="text-[11px] text-slate-400">{item.borrowerPhone}</p>
        </div>
      ),
    },
    { key: 'items', header: 'Alat Dipinjam', render: (item) => <span className="text-xs text-slate-700 font-medium">{getEquipmentNames(item)}</span> },
    {
      key: 'dates', header: 'Tanggal',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-500">Pinjam: <span className="font-medium text-slate-700">{formatDateID(item.borrowDate.split('T')[0])}</span></p>
          <p className="text-slate-500">Kembali: <span className="font-medium text-slate-700">{formatDateID(item.returnDate.split('T')[0])}</span></p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.status} type="loan" />
          {item.overdueDays !== undefined && item.overdueDays > 0 && (
            <p className="text-[10px] font-bold text-red-600">⚠ Terlambat {item.overdueDays} hari</p>
          )}
        </div>
      ),
    },
    {
      key: 'action', header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => { setSelectedLoan(item); setIsDetailOpen(true); }} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Detail"><Eye className="w-4 h-4" /></button>
          {isAdmin && (
            <>
              <button onClick={() => handleOpenReturn(item)} className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 cursor-pointer" title="Proses Pengembalian"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={() => { setSelectedLoan(item); setIsLoanDeleteOpen(true); }} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer" title="Hapus"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  const historyColumns: Column<LoanWithOverdue>[] = [
    {
      key: 'borrowerName', header: 'Peminjam',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{item.borrowerName}</p>
          <p className="text-[11px] text-slate-400">{item.borrowerPhone}</p>
        </div>
      ),
    },
    { key: 'items', header: 'Alat Dipinjam', render: (item) => <span className="text-xs text-slate-700 font-medium">{getEquipmentNames(item)}</span> },
    {
      key: 'dates', header: 'Tanggal Pinjam & Kembali',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-500">Pinjam: <span className="font-medium text-slate-700">{formatDateID(item.borrowDate.split('T')[0])}</span></p>
          {item.actualReturnDate && (
            <p className="text-slate-500">Dikembalikan: <span className="font-medium text-emerald-700">{formatDateID(item.actualReturnDate.split('T')[0])}</span></p>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: () => <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">✓ Selesai</span> },
    { key: 'purpose', header: 'Keperluan', render: (item) => <span className="text-xs text-slate-500 truncate max-w-[180px] inline-block">{item.purpose ?? '-'}</span> },
  ];

  // ─── Equipment form shared ────────────────────────────────────────────────────

  const EqForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nama Alat *</label>
          <input required className={inputCls} value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })} placeholder="Cth: Kamera DSLR Canon" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Kode Inventaris *</label>
          <input required className={inputCls} value={eqForm.code} onChange={(e) => setEqForm({ ...eqForm, code: e.target.value })} placeholder="Cth: KAM-001" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Kategori</label>
          <input className={inputCls} value={eqForm.category} onChange={(e) => setEqForm({ ...eqForm, category: e.target.value })} placeholder="Cth: Kamera & Audio" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Merek / Brand</label>
          <input className={inputCls} value={eqForm.brand} onChange={(e) => setEqForm({ ...eqForm, brand: e.target.value })} placeholder="Cth: Canon, Sony, DJI" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nomor Seri</label>
          <input className={inputCls} value={eqForm.serialNumber} onChange={(e) => setEqForm({ ...eqForm, serialNumber: e.target.value })} placeholder="Opsional" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Total Unit *</label>
          <input type="number" min={1} required className={inputCls} value={eqForm.total} onChange={(e) => setEqForm({ ...eqForm, total: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Lokasi Penyimpanan</label>
          <input className={inputCls} value={eqForm.storage} onChange={(e) => setEqForm({ ...eqForm, storage: e.target.value })} placeholder="Cth: Rak A3, Lemari Studio" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Kondisi</label>
          <select className={inputCls} value={eqForm.condition} onChange={(e) => setEqForm({ ...eqForm, condition: e.target.value })}>
            {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block font-bold text-slate-700 mb-1">Deskripsi</label>
        <textarea rows={2} className={inputCls} value={eqForm.description} onChange={(e) => setEqForm({ ...eqForm, description: e.target.value })} placeholder="Keterangan tambahan alat..." />
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <CustomButton type="button" variant="outline" onClick={() => { setIsEqCreateOpen(false); setIsEqEditOpen(false); }}>Batal</CustomButton>
        <CustomButton type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : title}</CustomButton>
      </div>
    </form>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return <AdminLayout title="Inventaris & Peminjaman Alat"><DashboardSkeleton /></AdminLayout>;
  }

  return (
    <AdminLayout title="Inventaris & Peminjaman Alat">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard title="Total Unit" value={totalEq} subtitle="Semua alat" icon={Package} iconBgClass="bg-slate-100" iconColorClass="text-slate-600" />
        <StatCard title="Tersedia" value={availableEq} subtitle="Siap dipinjam" icon={CheckCircle} iconBgClass="bg-emerald-50" iconColorClass="text-emerald-600" />
        <StatCard title="Dipinjam" value={borrowedEq} subtitle="Dalam pemakaian" icon={Clock} iconBgClass="bg-sky-50" iconColorClass="text-sky-600" />
        <StatCard title="Rusak / Terlambat" value={`${brokenEq} / ${overdueCount}`} subtitle="Perlu perhatian" icon={AlertTriangle} iconBgClass="bg-red-50" iconColorClass="text-red-600" />
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'peminjaman' && overdueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">{overdueCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB: INVENTARIS ─────────────────────────────────────────────── */}
        {activeTab === 'inventaris' && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SearchBox value={eqSearch} onChange={setEqSearch} placeholder="Cari nama / kode alat..." className="flex-1 sm:max-w-xs" />
              <FilterDropdown
                placeholder="Semua Kategori"
                value={eqCategoryFilter}
                onChange={setEqCategoryFilter}
                options={uniqueCategories.map((c) => ({ label: c, value: c }))}
                className="sm:w-48"
              />
              {isAdmin && (
                <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreateEq}>
                  Tambah Alat
                </CustomButton>
              )}
            </div>
            <DataTable columns={eqColumns} data={filteredEquipment} emptyMessage="Belum ada data inventaris peralatan." />
          </div>
        )}

        {/* ── TAB: PEMINJAMAN AKTIF & TERLAMBAT ───────────────────────────── */}
        {activeTab === 'peminjaman' && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SearchBox value={loanSearch} onChange={setLoanSearch} placeholder="Cari peminjam / alat..." className="flex-1 sm:max-w-xs" />
              <FilterDropdown
                placeholder="Semua Status"
                value={loanStatusFilter}
                onChange={setLoanStatusFilter}
                options={[
                  { label: 'Sedang Dipinjam', value: 'SEDANG_DIPINJAM' },
                  { label: 'Terlambat', value: 'TERLAMBAT' },
                ]}
                className="sm:w-48"
              />
              <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreateLoan}>
                Catat Peminjaman
              </CustomButton>
            </div>
            <DataTable columns={loanColumns} data={filteredLoans} emptyMessage="Tidak ada peminjaman aktif saat ini." />
          </div>
        )}

        {/* ── TAB: RIWAYAT PEMINJAMAN ─────────────────────────────────────── */}
        {activeTab === 'riwayat' && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SearchBox value={historySearch} onChange={setHistorySearch} placeholder="Cari riwayat peminjaman..." className="flex-1 sm:max-w-xs" />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Archive className="w-4 h-4" />
                <span>{filteredHistory.length} transaksi selesai</span>
              </div>
            </div>
            <DataTable columns={historyColumns} data={filteredHistory} emptyMessage="Belum ada riwayat peminjaman yang selesai." />
          </div>
        )}
      </div>

      {/* ── MODAL: TAMBAH ALAT ───────────────────────────────────────────────── */}
      <CustomModal isOpen={isEqCreateOpen} onClose={() => setIsEqCreateOpen(false)} title="Tambah Alat ke Inventaris" maxWidth="lg">
        <EqForm onSubmit={handleCreateEqSubmit} title="Simpan Alat" />
      </CustomModal>

      {/* ── MODAL: EDIT ALAT ─────────────────────────────────────────────────── */}
      <CustomModal isOpen={isEqEditOpen} onClose={() => setIsEqEditOpen(false)} title={`Edit: ${selectedEquipment?.name}`} maxWidth="lg">
        <EqForm onSubmit={handleEditEqSubmit} title="Perbarui Alat" />
      </CustomModal>

      {/* ── MODAL: HAPUS ALAT ────────────────────────────────────────────────── */}
      <CustomModal isOpen={isEqDeleteOpen} onClose={() => setIsEqDeleteOpen(false)} title="Konfirmasi Hapus Alat" maxWidth="sm">
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
          <p className="text-sm font-bold text-slate-800">Hapus &quot;{selectedEquipment?.name}&quot; dari inventaris?</p>
          <p className="text-xs text-slate-500 leading-relaxed">Alat yang sedang dipinjam tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsEqDeleteOpen(false)}>Batal</CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteEq} disabled={isSubmitting}>Ya, Hapus</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── MODAL: CATAT PEMINJAMAN ──────────────────────────────────────────── */}
      <CustomModal isOpen={isCreateLoanOpen} onClose={() => setIsCreateLoanOpen(false)} title="Catat Peminjaman Alat" maxWidth="xl">
        <form onSubmit={handleCreateLoanSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Peminjam *</label>
              <input required className={inputCls} value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} placeholder="Nama lengkap peminjam" readOnly={!isAdmin} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor HP/WA *</label>
              <input required className={inputCls} value={borrowerPhone} onChange={(e) => setBorrowerPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Pinjam *</label>
              <input type="date" required className={inputCls} value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Kembali *</label>
              <input type="date" required className={inputCls} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={borrowDate} />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keperluan Peminjaman *</label>
            <textarea rows={2} required className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Deskripsi keperluan peminjaman alat..." />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kegiatan Terkait (Opsional)</label>
            <select
              className={inputCls}
              value={selectedActivityId || ''}
              onChange={(e) => setSelectedActivityId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">-- Tidak dikaitkan dengan kegiatan khusus --</option>
              {activitiesList.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Peralatan *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {equipment.filter((e) => e.available > 0 || selectedItems.some((i) => i.equipmentId === e.id)).map((eq) => {
                const sel = selectedItems.find((i) => i.equipmentId === eq.id);
                return (
                  <div key={eq.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{eq.name}</p>
                      <p className="text-[10px] text-slate-500">Kode: {eq.code} • Tersedia: <strong className="text-teal-700">{eq.available}</strong>/{eq.total}</p>
                    </div>
                    {sel ? (
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handleUpdateItemQty(eq.id, sel.quantity - 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold">-</button>
                        <span className="font-bold w-5 text-center">{sel.quantity}</span>
                        <button type="button" onClick={() => handleUpdateItemQty(eq.id, sel.quantity + 1)} className="w-6 h-6 rounded bg-teal-100 text-teal-800 hover:bg-teal-200 flex items-center justify-center font-bold">+</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleAddItem(eq.id)} disabled={eq.available < 1} className={`px-2.5 py-1 rounded-md font-semibold text-xs ${eq.available < 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>+ Pilih</button>
                    )}
                  </div>
                );
              })}
              {equipment.filter((e) => e.available > 0).length === 0 && (
                <div className="col-span-2 text-center py-4 text-slate-400">Tidak ada alat tersedia</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateLoanOpen(false)}>Batal</CustomButton>
            <CustomButton type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Peminjaman'}</CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL: PROSES PENGEMBALIAN ───────────────────────────────────────── */}
      <CustomModal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} title="Proses Pengembalian Alat" subtitle={selectedLoan ? `Peminjam: ${selectedLoan.borrowerName}` : ''} maxWidth="md">
        <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
          <p className="text-slate-600 font-medium text-xs leading-relaxed">
            Tentukan jumlah unit yang dikembalikan dan kondisinya. Alat rusak akan dipindahkan ke <strong>stok rusak</strong> dan tidak kembali ke stok tersedia.
          </p>

          <div className="space-y-3 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {selectedLoan?.items?.map((item) => {
              const remaining = item.quantity - item.returnedQuantity;
              if (remaining <= 0) return null;
              return (
                <div key={item.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">{item.equipment?.name}</p>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Belum kembali: {remaining}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Jumlah Dikembalikan</label>
                      <input type="number" min={0} max={remaining} value={returnQuantities[item.id] ?? remaining} onChange={(e) => setReturnQuantities({ ...returnQuantities, [item.id]: Math.min(remaining, Math.max(0, Number(e.target.value))) })} className="w-full border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Kondisi Alat</label>
                      <select value={returnConditions[item.id] ?? 'BAIK'} onChange={(e) => setReturnConditions({ ...returnConditions, [item.id]: e.target.value })} className="w-full border border-slate-300 rounded-lg p-1.5 font-medium text-slate-800">
                        {RETURN_CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {returnConditions[item.id] && returnConditions[item.id] !== 'BAIK' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                      <Wrench className="w-3 h-3 flex-shrink-0" />
                      <span>Alat ini akan masuk ke stok rusak dan tidak tersedia untuk dipinjam.</span>
                    </div>
                  )}
                </div>
              );
            })}
            {selectedLoan?.items?.every((i) => i.returnedQuantity >= i.quantity) && (
              <div className="text-center py-3 text-emerald-700 font-semibold"><XCircle className="w-5 h-5 mx-auto mb-1" />Semua alat sudah dikembalikan.</div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsReturnOpen(false)}>Batal</CustomButton>
            <CustomButton type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Konfirmasi Pengembalian'}</CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL: DETAIL PEMINJAMAN ─────────────────────────────────────────── */}
      <CustomModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Peminjaman Alat" maxWidth="md">
        {selectedLoan && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedLoan.status} type="loan" />
              {(selectedLoan.overdueDays ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">⚠ Terlambat {selectedLoan.overdueDays} hari</span>
              )}
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
              <p><strong>Peminjam:</strong> {selectedLoan.borrowerName}</p>
              <p><strong>Nomor HP:</strong> {selectedLoan.borrowerPhone}</p>
              <p><strong>Keperluan:</strong> {selectedLoan.purpose ?? '-'}</p>
              <p><strong>Tanggal Pinjam:</strong> {formatDateID(selectedLoan.borrowDate.split('T')[0])}</p>
              <p><strong>Batas Kembali:</strong> {formatDateID(selectedLoan.returnDate.split('T')[0])}</p>
              {selectedLoan.actualReturnDate && <p><strong>Dikembalikan:</strong> {formatDateID(selectedLoan.actualReturnDate.split('T')[0])}</p>}
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-2">Daftar Alat & Status:</p>
              <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                {selectedLoan.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">{item.equipment?.name}</span>
                    <span className="text-slate-600">Pinjam: {item.quantity} | Kembali: <strong className="text-emerald-700">{item.returnedQuantity}</strong></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>Tutup</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL: HAPUS CATATAN PEMINJAMAN ─────────────────────────────────── */}
      <CustomModal isOpen={isLoanDeleteOpen} onClose={() => setIsLoanDeleteOpen(false)} title="Konfirmasi Hapus Catatan" maxWidth="sm">
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
          <p className="text-sm font-bold text-slate-800">Hapus catatan peminjaman ini?</p>
          <p className="text-xs text-slate-500 leading-relaxed">Tindakan ini tidak dapat dibatalkan dan data peminjaman akan hilang dari sistem.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsLoanDeleteOpen(false)}>Batal</CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteLoan} disabled={isSubmitting}>Ya, Hapus</CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
