'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DutySchedule } from '@/types';

interface ScheduleCalendarProps {
  schedules?: DutySchedule[];
  onSelectDate?: (dateStr: string) => void;
  onSelectSchedule?: (schedule: DutySchedule) => void;
}

export default function ScheduleCalendar({
  schedules = [],
  onSelectDate,
  onSelectSchedule,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // Default May 2025 matching screenshot

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Fill leading empty slots
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Fill actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-800">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Hari Ini
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName) => (
          <div key={dayName} className="py-3">
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map((dateObj, idx) => {
          if (!dateObj) {
            return <div key={`empty-${idx}`} className="min-h-[110px] bg-slate-50/40" />;
          }

          const dayNum = dateObj.getDate();
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(
            2,
            '0',
          )}`;
          const daySchedules = schedules.filter((s) => s.date === dateStr);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              className="min-h-[110px] p-2 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  {dayNum}
                </span>
              </div>

              <div className="space-y-1 mt-1 overflow-y-auto max-h-[75px]">
                {daySchedules.map((sched) => (
                  <div
                    key={sched.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSchedule && onSelectSchedule(sched);
                    }}
                    className="bg-teal-50 border border-teal-200/80 text-teal-800 text-[10px] px-2 py-1 rounded-lg font-medium leading-tight truncate hover:bg-teal-100 transition-colors"
                  >
                    <span className="font-semibold">{sched.user.fullName.split(' ')[0]}</span> (
                    {sched.startTime})
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
