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
  Edit3,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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
  };
}

const membersList = [
  { id: 1, name: 'Komang Ari', role: 'Koordinator Humas', color: '#0D9488', bgClass: 'bg-teal-50 text-teal-800 border-teal-200', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 2, name: 'Rina Wati', role: 'Jurnalis Lapangan', color: '#0284C7', bgClass: 'bg-sky-50 text-sky-800 border-sky-200', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 3, name: 'Budi Santoso', role: 'Videografer Utama', color: '#16A34A', bgClass: 'bg-green-50 text-green-800 border-green-200', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 4, name: 'Andi Saputra', role: 'Fotografer Resmi', color: '#D97706', bgClass: 'bg-amber-50 text-amber-800 border-amber-200', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

const initialEvents: ScheduleEvent[] = [
  {
    id: '101',
    title: 'Komang Ari (08:00 - 16:00)',
    start: '2025-05-02T08:00:00',
    end: '2025-05-02T16:00:00',
    backgroundColor: '#0D9488',
    extendedProps: {
      memberId: 1,
      memberName: 'Komang Ari',
      role: 'Koordinator Humas',
      location: 'Posko Humas Rektorat Lt. 1',
      shift: '08:00 - 16:00 WIB',
      note: 'Koordinator peliputan pagi dan koordinasi tamu VIP.',
      avatar: membersList[0].avatar,
    },
  },
  {
    id: '102',
    title: 'Rina Wati (08:00 - 16:00)',
    start: '2025-05-05T08:00:00',
    end: '2025-05-05T16:00:00',
    backgroundColor: '#0284C7',
    extendedProps: {
      memberId: 2,
      memberName: 'Rina Wati',
      role: 'Jurnalis Lapangan',
      location: 'Gedung Serbaguna Polinela',
      shift: '08:00 - 16:00 WIB',
      note: 'Piket liputan wisuda mahasiswa.',
      avatar: membersList[1].avatar,
    },
  },
  {
    id: '103',
    title: 'Budi Santoso (13:00 - 20:00)',
    start: '2025-05-12T13:00:00',
    end: '2025-05-12T20:00:00',
    backgroundColor: '#16A34A',
    extendedProps: {
      memberId: 3,
      memberName: 'Budi Santoso',
      role: 'Videografer Utama',
      location: 'Studio Humas & Multimedia',
      shift: '13:00 - 20:00 WIB',
      note: 'Perekaman dan editing podcast dies natalis.',
      avatar: membersList[2].avatar,
    },
  },
  {
    id: '104',
    title: 'Andi Saputra (08:00 - 16:00)',
    start: '2025-05-19T08:00:00',
    end: '2025-05-19T16:00:00',
    backgroundColor: '#D97706',
    extendedProps: {
      memberId: 4,
      memberName: 'Andi Saputra',
      role: 'Fotografer Resmi',
      location: 'Ruang Sidang Utama',
      shift: '08:00 - 16:00 WIB',
      note: 'Dokumentasi foto MoU industri.',
      avatar: membersList[3].avatar,
    },
  },
  {
    id: '105',
    title: 'Komang Ari (08:00 - 16:00)',
    start: '2025-05-21T08:00:00',
    end: '2025-05-21T16:00:00',
    backgroundColor: '#0D9488',
    extendedProps: {
      memberId: 1,
      memberName: 'Komang Ari',
      role: 'Koordinator Humas',
      location: 'Gedung Serbaguna Polinela',
      shift: '08:00 - 16:00 WIB',
      note: 'Penanggung jawab peliputan Menteri Pendidikan.',
      avatar: membersList[0].avatar,
    },
  },
  {
    id: '106',
    title: 'Rina Wati (08:00 - 16:00)',
    start: '2025-05-28T08:00:00',
    end: '2025-05-28T16:00:00',
    backgroundColor: '#0284C7',
    extendedProps: {
      memberId: 2,
      memberName: 'Rina Wati',
      role: 'Jurnalis Lapangan',
      location: 'Posko Humas Rektorat Lt. 1',
      shift: '08:00 - 16:00 WIB',
      note: 'Piket rutin pelayanan kehumasan kampus.',
      avatar: membersList[1].avatar,
    },
  },
];

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [mounted, setMounted] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberFilters, setSelectedMemberFilters] = useState<number[]>(membersList.map((m) => m.id));

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMemberId, setFormMemberId] = useState(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('16:00');
  const [formLocation, setFormLocation] = useState('Posko Humas Rektorat Lt. 1');
  const [formNote, setFormNote] = useState('');

  const calendarRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
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
    const matchMember = selectedMemberFilters.includes(ev.extendedProps.memberId);
    const matchSearch =
      ev.extendedProps.memberName.toLowerCase().includes(searchMember.toLowerCase()) ||
      ev.extendedProps.location.toLowerCase().includes(searchMember.toLowerCase());
    return matchMember && matchSearch;
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

  const handleEventDrop = (arg: any) => {
    const ev = events.find((e) => e.id === arg.event.id);
    if (ev) {
      toast.success(`Jadwal "${ev.extendedProps.memberName}" dipindahkan ke tanggal ${arg.event.startStr.split('T')[0]}.`);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = membersList.find((m) => m.id === Number(formMemberId)) || membersList[0];

    const newEvent: ScheduleEvent = {
      id: String(Date.now()),
      title: `${member.name} (${formStartTime} - ${formEndTime})`,
      start: `${formDate}T${formStartTime}:00`,
      end: `${formDate}T${formEndTime}:00`,
      backgroundColor: member.color,
      extendedProps: {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        location: formLocation,
        shift: `${formStartTime} - ${formEndTime} WIB`,
        note: formNote,
        avatar: member.avatar,
      },
    };

    setEvents([...events, newEvent]);
    setIsAssignOpen(false);
    setFormNote('');
    toast.success(`Jadwal piket berhasil ditambahkan untuk ${member.name}!`);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setEvents(events.filter((e) => e.id !== selectedEvent.id));
    setIsDetailOpen(false);
    toast.success(`Jadwal piket "${selectedEvent.extendedProps.memberName}" berhasil dihapus.`);
  };

  return (
    <AdminLayout title="Jadwal Piket Tim Humas">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
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

            <SearchBox
              value={searchMember}
              onChange={setSearchMember}
              placeholder="Cari nama personel..."
              className="w-full"
            />

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
                        <p className="font-bold truncate">{m.name}</p>
                        <p className="text-[10px] opacity-80 truncate">{m.role}</p>
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
              initialDate="2025-05-01" // Default May 2025 matching Image 3 specification
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
              Memuat Jadwal Piket FullCalendar...
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
              placeholder="Contoh: Posko Humas Rektorat Lt. 1"
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
