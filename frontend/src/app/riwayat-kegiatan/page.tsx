'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import { Eye } from 'lucide-react';
import { Activity } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { activityService } from '@/services';

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const filteredActivities = activities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      header: 'Tanggal',
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
      key: 'members',
      header: 'Job Desk',
      render: (item) => (
        <div className="text-xs text-slate-600 max-w-xs">
          {(item.members ?? []).length > 0 ? (
            (item.members ?? []).map((m) => (
              <span key={m.id} className="inline-block mr-1 mb-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md">
                {m.user.fullName}: {m.role}
              </span>
            ))
          ) : (
            <span className="text-slate-400">Belum ada penugasan</span>
          )}
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
        <Link
          href={`/kegiatan/${item.id}`}
          className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          title="Lihat Detail"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
      className: 'text-center w-16',
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
            placeholder="Cari nama kegiatan, lokasi, atau PIC..."
            className="w-full sm:w-80"
          />
          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'SELESAI', label: 'Selesai' },
              { value: 'DIBATALKAN', label: 'Dibatalkan' },
            ]}
            placeholder="Filter Status"
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
    </AdminLayout>
  );
}