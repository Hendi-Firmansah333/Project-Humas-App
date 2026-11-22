'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  CustomButton,
  CustomModal,
  SearchBox,
  UserAvatar,
  CustomDatePicker,
  CustomTimePicker,
  FilterDropdown,
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
  Search,
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
    if (calendarRef.current && (monthFilter || yearFilter)) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = calendarApi.getDate();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const targetYear = yearFilter ? Number(yearFilter) : currentYear;
      const targetMonth = monthFilter ? Number(monthFilter) - 1 : currentMonth;

      const targetDate = new Date(targetYear, targetMonth, 1);
      calendarApi.gotoDate(targetDate);
    }
  }, [monthFilter, yearFilter]);

  useEffect(() => {
    setMounted(true);

    const init = async () => {
      try {
        const users = await userService.getAll();
        // Hanya Anggota Humas (role USER) yang berstatus AKTIF yang dapat dijadwalkan piket
        const eligibleUsers = (Array.isArray(users) ? users : []).filter(
          (u: any) => u.role === 'USER' && u.status === 'AKTIF'
        );
        const members = eligibleUsers.map(userToMemberOption);
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
      {/* Top Filter Bar - Figma Spec: 18px radius, Poppins font, 40px inputs */}
      <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-[#90A1B9] uppercase tracking-[0.55px] font-['Poppins'] mb-1.5">
            Cari Jadwal
          </label>
          <div className="relative flex items-center w-full h-[40px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] px-3.5 focus-within:bg-white focus-within:border-[#003D58] focus-within:ring-1 focus-within:ring-[#003D58]/20 transition-all">
            <Search className="w-4 h-4 text-[#90A1B9] shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Nama personel / lokasi..."
              className="w-full bg-transparent text-xs text-[#45556C] placeholder:text-[#90A1B9] focus:outline-none font-['Poppins']"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-[#90A1B9] uppercase tracking-[0.55px] font-['Poppins'] mb-1.5">
            Hari Piket
          </label>
          <FilterDropdown
            value={dayFilter}
            onChange={(val) => setDayFilter(val)}
            placeholder="Semua Hari"
            options={[
              { value: 'Senin', label: 'Senin' },
              { value: 'Selasa', label: 'Selasa' },
              { value: 'Rabu', label: 'Rabu' },
              { value: 'Kamis', label: 'Kamis' },
              { value: 'Jumat', label: 'Jumat' },
              { value: 'Sabtu', label: 'Sabtu' },
              { value: 'Minggu', label: 'Minggu' },
            ]}
            className="w-full"
            icon={false}
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-[#90A1B9] uppercase tracking-[0.55px] font-['Poppins'] mb-1.5">
            Status
          </label>
          <FilterDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Semua Status"
            options={[
              { value: 'AKAN_DATANG', label: 'Akan Datang' },
              { value: 'SEDANG_BERLANGSUNG', label: 'Sedang Berlangsung' },
              { value: 'SELESAI', label: 'Selesai' },
            ]}
            className="w-full"
            icon={false}
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-[#90A1B9] uppercase tracking-[0.55px] font-['Poppins'] mb-1.5">
            Bulan
          </label>
          <FilterDropdown
            value={monthFilter}
            onChange={(val) => setMonthFilter(val)}
            placeholder="Semua Bulan"
            options={['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, idx) => ({
              value: String(idx + 1),
              label: m,
            }))}
            className="w-full"
            icon={false}
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-[11px] font-bold text-[#90A1B9] uppercase tracking-[0.55px] font-['Poppins'] mb-1.5">
            Tahun
          </label>
          <FilterDropdown
            value={yearFilter}
            onChange={(val) => setYearFilter(val)}
            placeholder="Semua Tahun"
            options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]}
            className="w-full"
            icon={false}
          />
        </div>
      </div>

      {/* Main Content Layout: Sidebar (~382px) + Calendar (Flex-1) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar - Width ~382px in Figma */}
        <div className="w-full lg:w-[360px] xl:w-[382px] shrink-0 space-y-6">
          {/* Card 1: Manajemen Piket */}
          <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#1D293D] font-['Poppins']">Manajemen Piket</h3>
              <p className="text-xs text-[#90A1B9] mt-0.5 font-['Poppins']">Atur & jadwalkan jam bertugas tim humas</p>
            </div>
            <button
              onClick={() => {
                setFormDate(new Date().toISOString().split('T')[0]);
                setIsAssignOpen(true);
              }}
              className="w-full h-[40px] bg-[#003D58] hover:bg-[#002f44] text-white font-semibold text-sm rounded-[14px] shadow-[0_1px_2px_rgba(53,198,212,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer font-['Poppins']"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Jadwal Piket</span>
            </button>
          </div>

          {/* Card 2: Filter Personel */}
          <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#051C42]" />
                <h4 className="text-base font-bold text-[#051C42] font-['Poppins']">Filter personel</h4>
              </div>
              <button
                onClick={() => setSelectedMemberFilters(membersList.map((m) => m.id))}
                className="text-xs font-bold text-[#003D58] hover:underline cursor-pointer font-['Poppins']"
              >
                Reset
              </button>
            </div>

            <p className="text-xs text-[#4A5A78] font-['Poppins'] mb-3">
              {selectedMemberFilters.length} dari {membersList.length} dipilih
            </p>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {membersList.map((m) => {
                const isSelected = selectedMemberFilters.includes(m.id);
                const initials = m.name
                  ? m.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'TH';

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemberFilter(m.id)}
                    className={`p-2.5 rounded-[14px] transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-white border-[#E2E8F0] shadow-xs'
                        : 'bg-slate-50/70 border-slate-100 opacity-60'
                    } hover:bg-slate-50`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-sky-50 text-[#003D58] font-bold text-xs flex items-center justify-center shrink-0 font-['Poppins']">
                          {initials}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-sm font-bold text-[#051C42] truncate font-['Poppins']">{m.name}</p>
                        <p className="text-[11px] text-[#4A5A78] truncate font-['Poppins']">{m.role || 'Tim Humas'}</p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#51FCE4] text-[#003D58]'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#003D58] stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: FullCalendar Card */}
        <div className="flex-1 min-w-0 bg-white rounded-[18px] border border-[#E2E8F0] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-h-[720px] flex flex-col">
          {mounted ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              firstDay={0}
              dayHeaderFormat={{ weekday: 'short' }}
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
              eventContent={(eventInfo) => {
                const dotColor = eventInfo.event.backgroundColor || '#E99710';
                const shift = eventInfo.event.extendedProps?.shift || '';
                const startTime = shift.split(' - ')[0] || '';
                const hour = startTime ? startTime.split(':')[0] : '';
                return (
                  <div className="flex items-center gap-1.5 px-1 py-0.5 truncate text-[11px] hover:opacity-80 transition-opacity cursor-pointer">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    {hour && (
                      <span className="font-semibold text-slate-700 shrink-0 font-['Poppins'] text-[11px]">
                        {hour}
                      </span>
                    )}
                    <span className="truncate font-bold text-[#1D293D] font-['Poppins'] text-[11px]">
                      {eventInfo.event.title}
                    </span>
                  </div>
                );
              }}
            />
          ) : (
            <div className="w-full h-[600px] bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-[#003D58] border-t-transparent rounded-full animate-spin" />
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
        maxWidth="xl"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-5 text-[12px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Pilih Personel Bertugas *</label>
              <FilterDropdown
                value={formMemberId ? String(formMemberId) : ''}
                onChange={(val) => setFormMemberId(Number(val))}
                options={membersList.map((m) => ({
                  value: String(m.id),
                  label: `${m.name} (${m.role})`,
                }))}
                placeholder="Pilih Anggota Humas"
                icon={false}
                allowClear={false}
                className="w-full"
              />
            </div>

            <CustomDatePicker
              label="Tanggal Piket"
              required
              value={formDate}
              onChange={(val) => setFormDate(val)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTimePicker
              label="Jam Mulai (WIB)"
              required
              value={formStartTime}
              onChange={(val) => setFormStartTime(val)}
            />
            <CustomTimePicker
              label="Jam Selesai (WIB)"
              required
              value={formEndTime}
              onChange={(val) => setFormEndTime(val)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Lokasi Posko / Piket *</label>
            <input
              type="text"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Contoh: Kantor Humas"
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Catatan Tugas Tambahan</label>
            <textarea
              rows={3}
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Tuliskan arahan khusus piket..."
              className="w-full min-h-[96px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/25 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[12px] font-semibold rounded-full transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-semibold rounded-full shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
            >
              Simpan Jadwal
            </button>
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
                <p className="text-xs text-[#003D58] font-semibold mt-0.5">{selectedEvent.extendedProps.role}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#003D58] shrink-0" />
                <span><strong>Shift Waktu:</strong> {selectedEvent.extendedProps.shift}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#003D58] shrink-0" />
                <span><strong>Lokasi Posko:</strong> {selectedEvent.extendedProps.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#003D58] shrink-0" />
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
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/80 text-blue-900 mt-2">
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
