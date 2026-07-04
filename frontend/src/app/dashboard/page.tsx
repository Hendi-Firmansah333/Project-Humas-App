'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  StatusBadge,
  DataTable,
  Column,
  ActivityChart,
  CampusMap,
  SearchBox,
  FilterDropdown,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  CalendarCheck2,
  FileText,
  Users,
  Wrench,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Camera,
  UserCheck,
} from 'lucide-react';
import { Activity, LocationData } from '@/types';
import { formatDateID } from '@/utils/formatters';

// Sample data exactly matching Image 1 and Image 2 specifications
const sampleActivities: Activity[] = [
  {
    id: 1,
    title: 'Liputan Kunjungan Menteri Pendidikan',
    category: 'Liputan Resmi',
    date: '2025-05-21',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Gedung Serbaguna Polinela',
    status: 'SEDANG_BERLANGSUNG',
    description: 'Dokumentasi foto dan video kedatangan tamu kementerian.',
    picId: 1,
    pic: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: 'ADMIN',
      roleLabel: 'Admin Humas',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 2,
    title: 'Konferensi Pers Dies Natalis ke-41',
    category: 'Konferensi Pers',
    date: '2025-05-22',
    startTime: '13:30',
    endTime: '15:30',
    location: 'Ruang Sidang Utama Rektorat',
    status: 'AKAN_DATANG',
    description: 'Persiapan media rilis dan wawancara pimpinan kampus.',
    picId: 2,
    pic: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 3,
    title: 'Podcast Campus Life Episode 12',
    category: 'Media Produksi',
    date: '2025-05-23',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Studio Humas Polinela',
    status: 'AKAN_DATANG',
    description: 'Recording dengan BEM Polinela mengenai kegiatan mahasiswa baru.',
    picId: 3,
    pic: {
      id: 3,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      role: 'VIDEOGRAFER',
      roleLabel: 'Videografer',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 4,
    title: 'Dokumentasi Penandatanganan MoU Industri',
    category: 'Kerjasama',
    date: '2025-05-19',
    startTime: '08:30',
    endTime: '11:00',
    location: 'Ruang VIP Rektorat Lantai 2',
    status: 'SELESAI',
    description: 'Pengambilan foto resmi penandatanganan kerja sama PT Charoen Pokphand.',
    picId: 4,
    pic: {
      id: 4,
      fullName: 'Andi Saputra',
      username: 'andi.s',
      email: 'andi@polinela.ac.id',
      role: 'FOTOGRAFER',
      roleLabel: 'Fotografer',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 5,
    title: 'Publikasi Artikel Prestasi Mahasiswa Nasional',
    category: 'Rilis Berita',
    date: '2025-05-18',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Online / Website Resmi',
    status: 'SELESAI',
    description: 'Penyusunan berita juara 1 Kompetisi Inovasi Pertanian.',
    picId: 2,
    pic: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
];

const sampleLocations: LocationData[] = [
  {
    id: 1,
    userId: 1,
    user: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: 'ADMIN',
      roleLabel: 'Koordinator Humas',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
    latitude: -5.3585,
    longitude: 105.2345,
    address: 'Gedung Serbaguna Polinela (Liputan Menteri)',
    isOnline: true,
    updatedAt: '10 menit lalu',
  },
  {
    id: 2,
    userId: 2,
    user: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis Lapangan',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
    latitude: -5.3592,
    longitude: 105.2358,
    address: 'Gedung Rektorat Lantai 1 (Wawancara Direktur)',
    isOnline: true,
    updatedAt: '5 menit lalu',
  },
  {
    id: 3,
    userId: 3,
    user: {
      id: 3,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      role: 'VIDEOGRAFER',
      roleLabel: 'Videografer',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
    latitude: -5.3578,
    longitude: 105.2332,
    address: 'Studio Humas & Multimedia',
    isOnline: true,
    updatedAt: '2 menit lalu',
  },
];

const recentCheckIns = [
  { id: 1, name: 'Komang Ari', time: '08:15 WIB', location: 'Gedung Serbaguna', role: 'Admin Humas', status: 'SUCCESS' },
  { id: 2, name: 'Rina Wati', time: '08:28 WIB', location: 'Rektorat Lt. 1', role: 'Jurnalis', status: 'SUCCESS' },
  { id: 3, name: 'Budi Santoso', time: '08:45 WIB', location: 'Studio Humas', role: 'Videografer', status: 'SUCCESS' },
  { id: 4, name: 'Andi Saputra', time: '09:10 WIB', location: 'Laboratorium Tanaman', role: 'Fotografer', status: 'SUCCESS' },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate initial network fetch for skeleton showcase
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredActivities = sampleActivities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.pic.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory ? act.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  const columns: Column<Activity>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => <span className="font-semibold text-slate-600">{idx + 1}</span>,
      className: 'w-12',
    },
    {
      key: 'title',
      header: 'Judul Kegiatan',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => (
        <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs">
          {item.category}
        </span>
      ),
    },
    {
      key: 'dateTime',
      header: 'Tanggal & Waktu',
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-700">{formatDateID(item.date)}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.startTime} - {item.endTime} WIB
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{item.location}</span>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
            {item.pic.fullName.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-slate-700 text-xs">{item.pic.fullName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Main Dashboard Overview">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Main Dashboard Overview">
      {/* Row 1: KPI Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Kegiatan"
          value={124}
          subtitle="+12 bulan ini"
          icon={CalendarCheck2}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Content Terjadwal"
          value={48}
          subtitle="8 menunggu publikasi"
          icon={FileText}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Personel Aktif"
          value="18 / 24"
          subtitle="6 sedang di lapangan"
          icon={Users}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Alat Dipinjam"
          value={14}
          subtitle="2 terlambat dikembalikan"
          icon={Wrench}
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-600"
        />
      </div>

      {/* Row 2: Live Location Map (Left) & Upcoming Activities (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Interactive Map Section - 2 Columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Live Location Tim Kehumasan</h3>
                <p className="text-xs text-slate-400">Pantau lokasi petugas bertugas secara real-time di kampus</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span>3 Online</span>
            </span>
          </div>

          <div className="flex-1">
            <CampusMap locations={sampleLocations} height="h-80 sm:h-96" />
          </div>
        </div>

        {/* Upcoming Activities Section - 1 Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Kegiatan Mendatang</h3>
            </div>
            <a href="/kegiatan" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {sampleActivities.slice(0, 3).map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/40 hover:border-teal-200 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="bg-teal-600 text-white font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {formatDateID(act.date)}
                  </span>
                  <StatusBadge status={act.status} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-teal-700 transition-colors">
                  {act.title}
                </h4>
                <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{act.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                    <span>⏰ {act.startTime} - {act.endTime} WIB</span>
                    <span className="font-semibold text-slate-700">PIC: {act.pic.fullName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Statistics Chart (Left) & Recent Check-in Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <ActivityChart title="Grafik Kegiatan & Konten (6 Bulan Terakhir)" />
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Recent Check-in Personel</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Hari Ini</span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {recentCheckIns.map((ci) => (
              <div key={ci.id} className="relative pl-9 flex items-start justify-between text-xs group">
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-teal-100 border-2 border-teal-600 flex items-center justify-center shadow-xs" />
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">
                    {ci.name}{' '}
                    <span className="font-normal text-slate-400 text-[11px]">({ci.role})</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">Check-in di {ci.location}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">{ci.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Daftar Kegiatan Terbaru Table & Quick Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daftar Kegiatan Terbaru</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar lengkap kegiatan kehumasan minggu ini</p>
            </div>
            <div className="flex items-center gap-3">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari judul atau lokasi..."
                className="w-full sm:w-56"
              />
              <FilterDropdown
                options={[
                  { value: 'Liputan Resmi', label: 'Liputan Resmi' },
                  { value: 'Konferensi Pers', label: 'Konferensi Pers' },
                  { value: 'Media Produksi', label: 'Media Produksi' },
                ]}
                value={filterCategory}
                onChange={setFilterCategory}
                placeholder="Semua Kategori"
              />
            </div>
          </div>

          <DataTable columns={columns} data={filteredActivities} />
          <PaginationBar
            currentPage={currentPage}
            totalPages={1}
            totalItems={filteredActivities.length}
            onPageChange={setCurrentPage}
            itemName="kegiatan"
          />
        </div>

        {/* Quick Summary & Notification Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Ringkasan Tugas & Alert</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Peminjaman Butuh Persetujuan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">3 pengajuan alat kamera menunggu review</p>
                </div>
                <a href="/peminjaman-alat" className="text-xs font-bold text-orange-600 hover:underline">
                  Review
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Draft Konten Siap Publikasi</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">8 konten dijadwalkan tayang minggu ini</p>
                </div>
                <a href="/content-plan" className="text-xs font-bold text-sky-600 hover:underline">
                  Jadwal
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Alat Terlambat Kembali</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">2 unit lensa belum dikembalikan</p>
                </div>
                <a href="/peminjaman-alat" className="text-xs font-bold text-red-600 hover:underline">
                  Ingatkan
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-200">Kinerja Tim Bulan Ini</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold">94.8%</span>
              <span className="text-xs bg-teal-500/40 px-2 py-0.5 rounded-full">+4.2% vs bln lalu</span>
            </div>
            <p className="text-[11px] text-teal-100 mt-1">Seluruh kegiatan kehumasan berjalan tepat waktu.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
