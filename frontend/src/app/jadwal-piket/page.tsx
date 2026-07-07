'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  CustomButton,
  CustomModal,
  SearchBox,
  UserAvatar,
} from '@/components/common';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  MapPin,
  Trash2,
  Filter,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { scheduleService, userService } from '@/services';
import { DutySchedule } from '@/types';
import { formatApiDate, getMemberColor, userToMemberOption } from '@/utils/api-helpers';

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    memberId: number;
    memberName: string;
    role: string;
    location: string;
    shift: string;
    note?: string;
    avatar?: string;
    status: string;
  };
}

type MemberOption = ReturnType<typeof userToMemberOption>;

function mapScheduleToEvent(schedule: DutySchedule & { notes?: string; location?: string; status?: string }): ScheduleEvent {
  const dateStr = formatApiDate(schedule.date);
  const { startTime, endTime, user } = schedule;

  return {
    id: String(schedule.id),
    title: `${user.fullName} (${startTime} - ${endTime})`,
    start: `${dateStr}T${startTime}:00`,
    end: `${dateStr}T${endTime}:00`,
    backgroundColor: getMemberColor(schedule.userId),
    extendedProps: {
      memberId: schedule.userId,
      memberName: user.fullName,
      role: user.roleLabel,
      location: schedule.location || 'Kantor Humas',
      shift: `${startTime} - ${endTime} WIB`,
      note: schedule.notes,
      avatar: user.avatar,
      status: schedule.status || 'AKAN_DATANG',
    },
  };
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  // Filtering states
  const [dayFilter, setDayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedMemberFilters, setSelectedMemberFilters] = useState<number[]>([]);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMemberId, setFormMemberId] = useState(0);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('16:00');
  const [formLocation, setFormLocation] = useState('Kantor Humas');
  const [formNote, setFormNote] = useState('');

  const calendarRef = useRef<any>(null);

  const loadSchedules = async () => {
    try {
      const params: any = {};
      if (searchMember) params.search = searchMember;
      if (statusFilter) params.status = statusFilter;
      if (dayFilter) params.day = dayFilter;
      if (monthFilter) params.month = Number(monthFilter);
      if (yearFilter) params.year = Number(yearFilter);

      const schedules = await scheduleService.getAll(params);
      const list = Array.isArray(schedules) ? schedules : [];
      setEvents(list.map((schedule) => mapScheduleToEvent(schedule as DutySchedule & { notes?: string; location?: string })));
    } catch {
      toast.error('Gagal memuat jadwal piket dari server.');
      setEvents([]);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [searchMember, statusFilter, dayFilter, monthFilter, yearFilter]);

  useEffect(() => {
    setMounted(true);

    const init = async () => {
      try {
        const users = await userService.getAll();
        const members = (Array.isArray(users) ? users : []).map(userToMemberOption);
        setMembersList(members);
        setSelectedMemberFilters(members.map((m) => m.id));
        if (members.length > 0) {
          setFormMemberId(members[0].id);
        }
      } catch {
        toast.error('Gagal memuat data personel dari server.');
        setMembersList([]);
        setSelectedMemberFilters([]);
      }
    };

    init();
  }, []);

  const toggleMemberFilter = (id: number) => {
    if (selectedMemberFilters.includes(id)) {
      if (selectedMemberFilters.length > 1) {
        setSelectedMemberFilters(selectedMemberFilters.filter((mId) => mId !== id));
      } else {
        toast.warning('Minimal 1 personel harus dipilih untuk menampilkan jadwal.');
      }
    } else {
      setSelectedMemberFilters([...selectedMemberFilters, id]);
    }
  };

  const filteredEvents = events.filter((ev) => {
    return selectedMemberFilters.includes(ev.extendedProps.memberId);
  });

  const handleDateClick = (arg: any) => {
    setFormDate(arg.dateStr);
    setIsAssignOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const ev = events.find((e) => e.id === arg.event.id);
    if (ev) {
      setSelectedEvent(ev);
      setIsDetailOpen(true);
    }
  };

  const handleEventDrop = async (arg: any) => {
    const ev = events.find((e) => e.id === arg.event.id);
    if (!ev) return;

    const newDate = arg.event.startStr.split('T')[0];
    try {
      await scheduleService.update(Number(arg.event.id), { date: `${newDate}T00:00:00Z` });
      await loadSchedules();
      toast.success(`Jadwal "${ev.extendedProps.memberName}" dipindahkan ke tanggal ${newDate}.`);
    } catch (err: any) {
      arg.revert();
      const msg = err.response?.data?.message || 'Gagal memindahkan jadwal piket.';
      toast.error(msg);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = membersList.find((m) => m.id === Number(formMemberId)) || membersList[0];
    if (!member) {
      toast.error('Tidak ada personel tersedia.');
      return;
    }

    try {
      await scheduleService.create({
        userId: Number(formMemberId),
        date: `${formDate}T00:00:00Z`,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
        notes: formNote,
      });
      await loadSchedules();
      setIsAssignOpen(false);
      setFormNote('');
      setFormLocation('Kantor Humas');
      toast.success(`Jadwal piket berhasil ditambahkan untuk ${member.name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan jadwal piket.';
      toast.error(msg);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await scheduleService.remove(Number(selectedEvent.id));
      await loadSchedules();
      setIsDetailOpen(false);
      toast.success(`Jadwal piket "${selectedEvent.extendedProps.memberName}" berhasil dihapus.`);
    } catch {
      toast.error('Gagal menghapus jadwal piket.');
    }
  };

  return (
    <AdminLayout title="Jadwal Piket Tim Humas">
      {/* Spacing & Responsive Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cari Jadwal</label>
          <SearchBox
            value={searchMember}
            onChange={setSearchMember}
            placeholder="Nama personel / lokasi..."
            className="w-full"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hari Piket</label>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 py-2.5 px-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
          >
            <option value="">Semua Hari</option>
            <option value="Senin">Senin</option>
            <option value="Selasa">Selasa</option>
            <option value="Rabu">Rabu</option>
            <option value="Kamis">Kamis</option>
            <option value="Jumat">Jumat</option>
            <option value="Sabtu">Sabtu</option>
            <option value="Minggu">Minggu</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 py-2.5 px-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
          >
            <option value="">Semua Status</option>
            <option value="AKAN_DATANG">Akan Datang</option>
            <option value="SEDANG_BERLANGSUNG">Sedang Berlangsung</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bulan</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 py-2.5 px-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
          >
            <option value="">Semua Bulan</option>
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, idx) => (
              <option key={idx} value={String(idx + 1)}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tahun</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 py-2.5 px-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
          >
            <option value="">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar Sidebar - 1 Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Action Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Manajemen Piket</h3>
              <p className="text-xs text-slate-400 mt-0.5">Atur & jadwalkan jam bertugas tim humas</p>
            </div>
            <CustomButton
              variant="primary"
              icon={Plus}
              className="w-full"
              onClick={() => {
                setFormDate(new Date().toISOString().split('T')[0]);
                setIsAssignOpen(true);
              }}
            >
              Tambah Jadwal Piket
            </CustomButton>
          </div>

          {/* Member Filter Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-800">Filter Personel</h4>
              </div>
              <button
                onClick={() => setSelectedMemberFilters(membersList.map((m) => m.id))}
                className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {membersList.map((m) => {
                const isSelected = selectedMemberFilters.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemberFilter(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected ? m.bgClass : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar src={m.avatar} name={m.name} size="sm" />
                      <div className="truncate">
                        <p className="font-bold truncate text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.role}</p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-current text-white border-transparent' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: isSelected ? m.color : undefined }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FullCalendar Section - 3 Columns */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs min-h-[720px] flex flex-col">
          {mounted ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{
                today: 'Hari Ini',
                month: 'Bulan',
                week: 'Minggu',
                day: 'Hari',
              }}
              events={filteredEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              height="auto"
              locale="id"
            />
          ) : (
            <div className="w-full h-[600px] bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              Memuat Jadwal Piket...
            </div>
          )}
        </div>
      </div>

      {/* Assign Member Modal */}
      <CustomModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Penugasan Jadwal Piket"
        subtitle={`Tanggal: ${formDate}`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Personel Bertugas *</label>
            <select
              value={formMemberId}
              onChange={(e) => setFormMemberId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
            >
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Piket *</label>
            <input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Mulai (WIB) *</label>
              <input
                type="time"
                required
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Selesai (WIB) *</label>
              <input
                type="time"
                required
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Posko / Piket *</label>
            <input
              type="text"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Contoh: Kantor Humas"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Tugas Tambahan</label>
            <textarea
              rows={2}
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Tuliskan arahan khusus piket..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Jadwal
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Event Detail Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Jadwal Piket"
        maxWidth="sm"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <UserAvatar src={selectedEvent.extendedProps.avatar} name={selectedEvent.extendedProps.memberName} size="md" />
              <div>
                <p className="font-bold text-sm text-slate-800">{selectedEvent.extendedProps.memberName}</p>
                <p className="text-xs text-teal-600 font-semibold mt-0.5">{selectedEvent.extendedProps.role}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Shift Waktu:</strong> {selectedEvent.extendedProps.shift}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Lokasi Posko:</strong> {selectedEvent.extendedProps.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Status Piket: </strong>
                  <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                    selectedEvent.extendedProps.status === 'SELESAI'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                      : selectedEvent.extendedProps.status === 'SEDANG_BERLANGSUNG'
                        ? 'bg-amber-50 text-amber-700 border border-amber-250 animate-pulse'
                        : 'bg-blue-50 text-blue-700 border border-blue-250'
                  }`}>
                    {selectedEvent.extendedProps.status.replace('_', ' ')}
                  </span>
                </span>
              </div>
              {selectedEvent.extendedProps.note && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/80 text-teal-900 mt-2">
                  <p className="font-semibold mb-0.5">Catatan:</p>
                  <p>{selectedEvent.extendedProps.note}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <CustomButton variant="danger-outline" size="sm" icon={Trash2} onClick={handleDeleteEvent}>
                Hapus
              </CustomButton>
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
