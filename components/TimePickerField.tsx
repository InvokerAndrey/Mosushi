"use client";

import { useState, useEffect } from "react";

const DEFAULT_WORK_START_HOUR = 12;
const MINUTES = [0, 15, 30, 45];

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type WorkEnd = { hour: number; minute: number };

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMinTime(minOffsetMinutes: number): Date {
  const STEP = 15 * 60 * 1000;
  return new Date(Math.ceil((Date.now() + minOffsetMinutes * 60_000) / STEP) * STEP);
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDayAvailable(day: Date, minOffsetMinutes: number, workEnd: WorkEnd): boolean {
  const today = todayMidnight();
  const dayMid = new Date(day);
  dayMid.setHours(0, 0, 0, 0);

  if (dayMid < today) return false;

  if (dayMid.getTime() === today.getTime()) {
    const minTime = getMinTime(minOffsetMinutes);
    const todayAtEnd = new Date(today);
    todayAtEnd.setHours(workEnd.hour, workEnd.minute, 0, 0);
    return minTime <= todayAtEnd;
  }

  return true;
}

/**
 * Returns the allowed minutes for a given hour, respecting workStart, workStartMinute,
 * and workEnd boundaries.
 */
function getValidMinutesForHour(
  hour: number,
  workEnd: WorkEnd,
  workStart: number = DEFAULT_WORK_START_HOUR,
  workStartMinute: number = 0
): number[] {
  if (hour < workStart || hour > workEnd.hour) return [];

  let minutes = MINUTES;

  // Apply start-minute floor on the opening hour
  if (hour === workStart && workStartMinute > 0) {
    minutes = minutes.filter((m) => m >= workStartMinute);
  }

  // Apply end-minute ceiling on the closing hour
  if (hour === workEnd.hour) {
    minutes = minutes.filter((m) => m <= workEnd.minute);
  }

  return minutes;
}

function getAvailableHours(
  day: Date,
  minOffsetMinutes: number,
  workEnd: WorkEnd,
  workStart: number,
  workStartMinute: number = 0
): number[] {
  const today = todayMidnight();
  const dayMid = new Date(day);
  dayMid.setHours(0, 0, 0, 0);
  const isToday = dayMid.getTime() === today.getTime();
  const minTime = getMinTime(minOffsetMinutes);
  const hours: number[] = [];

  for (let h = workStart; h <= workEnd.hour; h++) {
    const validMinutes = getValidMinutesForHour(h, workEnd, workStart, workStartMinute);
    if (validMinutes.length === 0) continue;

    if (isToday) {
      const hasSlot = validMinutes.some((m) => {
        const slot = new Date(day);
        slot.setHours(h, m, 0, 0);
        return slot >= minTime;
      });
      if (hasSlot) hours.push(h);
    } else {
      hours.push(h);
    }
  }
  return hours;
}

function getAvailableMinutes(
  day: Date,
  hour: number,
  minOffsetMinutes: number,
  workEnd: WorkEnd,
  workStart: number = DEFAULT_WORK_START_HOUR,
  workStartMinute: number = 0
): number[] {
  const today = todayMidnight();
  const dayMid = new Date(day);
  dayMid.setHours(0, 0, 0, 0);
  const isToday = dayMid.getTime() === today.getTime();
  const minTime = getMinTime(minOffsetMinutes);
  const validMinutes = getValidMinutesForHour(hour, workEnd, workStart, workStartMinute);

  if (!isToday) return validMinutes;

  return validMinutes.filter((m) => {
    const slot = new Date(day);
    slot.setHours(hour, m, 0, 0);
    return slot >= minTime;
  });
}

function formatDayLabel(day: Date): string {
  const today = todayMidnight();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayMid = new Date(day);
  dayMid.setHours(0, 0, 0, 0);

  if (dayMid.getTime() === today.getTime()) return "Сегодня";
  if (dayMid.getTime() === tomorrow.getTime()) return "Завтра";
  return `${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`;
}

function buildValue(day: Date, hour: number, minute: number): string {
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${formatDayLabel(day)}, ${hh}:${mm}`;
}

function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = new Array(startDow).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  minOffsetMinutes: number;
  /** First selectable hour (e.g. 13 for delivery = opening+1, 12 for pickup). */
  workStart?: number;
  /**
   * Minimum minute within the first selectable hour.
   * e.g. 30 for pickup (earliest = opening:30), 0 for delivery.
   */
  workStartMinute?: number;
  /** Last available work slot, e.g. { hour: 22, minute: 0 }. */
  workEnd?: WorkEnd;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
};

const DEFAULT_WORK_END: WorkEnd = { hour: 22, minute: 0 };

export default function TimePickerField({
  minOffsetMinutes,
  workStart = DEFAULT_WORK_START_HOUR,
  workStartMinute = 0,
  workEnd = DEFAULT_WORK_END,
  value,
  onChange,
  hasError,
}: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  useEffect(() => {
    if (!value) {
      setSelectedDay(null);
      setSelectedHour(null);
      setSelectedMinute(null);
    }
  }, [value]);

  const today = todayMidnight();

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  const canGoNext = true;

  const weeks = getCalendarWeeks(viewYear, viewMonth);
  const availableHours = selectedDay
    ? getAvailableHours(selectedDay, minOffsetMinutes, workEnd, workStart, workStartMinute)
    : [];
  const availableMinutes =
    selectedDay && selectedHour !== null
      ? getAvailableMinutes(selectedDay, selectedHour, minOffsetMinutes, workEnd, workStart, workStartMinute)
      : [];

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day: Date) => {
    if (!isDayAvailable(day, minOffsetMinutes, workEnd)) return;
    setSelectedDay(day);
    setSelectedHour(null);
    setSelectedMinute(null);
    onChange("");
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    const newMinutes = getAvailableMinutes(selectedDay!, hour, minOffsetMinutes, workEnd, workStart, workStartMinute);
    if (selectedMinute !== null && !newMinutes.includes(selectedMinute)) {
      setSelectedMinute(null);
      onChange("");
    } else if (selectedMinute !== null && selectedDay) {
      onChange(buildValue(selectedDay, hour, selectedMinute));
    } else {
      onChange("");
    }
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedDay && selectedHour !== null) {
      onChange(buildValue(selectedDay, selectedHour, minute));
    }
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white shadow-sm ${
        hasError ? "border-accent" : "border-secondary/40"
      }`}
    >
      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary/20">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg text-text hover:bg-secondary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-text">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg text-text hover:bg-secondary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* ── Day-of-week header ── */}
      <div className="grid grid-cols-7 border-b border-secondary/20 bg-background">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-secondary py-2">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="px-2 py-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;

              const isCurrentMonth = day.getMonth() === viewMonth;
              const available = isDayAvailable(day, minOffsetMinutes, workEnd);
              const isSelected = selectedDay?.toDateString() === day.toDateString();
              const dayMid = new Date(day);
              dayMid.setHours(0, 0, 0, 0);
              const isTodayDay = dayMid.getTime() === today.getTime();

              let cls =
                "h-9 w-full flex items-center justify-center text-sm rounded-lg transition-colors select-none ";

              if (!isCurrentMonth) {
                cls += "text-secondary/30 cursor-default";
              } else if (isSelected) {
                cls += "bg-accent text-white font-bold cursor-pointer";
              } else if (!available) {
                cls += "text-secondary/35 cursor-not-allowed";
              } else {
                cls += "cursor-pointer hover:bg-accent/10 hover:text-accent text-text";
                if (isTodayDay) cls += " font-semibold";
              }

              return (
                <button
                  key={di}
                  type="button"
                  disabled={!available || !isCurrentMonth}
                  onClick={() => isCurrentMonth && handleDayClick(day)}
                  className={cls}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Time selectors ── */}
      <div className="border-t border-secondary/20 px-4 py-3 flex items-center justify-center gap-2 bg-background">
        <select
          value={selectedHour ?? ""}
          onChange={(e) => handleHourChange(Number(e.target.value))}
          disabled={!selectedDay}
          className="bg-white border border-secondary/40 rounded-lg px-2 py-1.5 text-sm text-text focus:border-accent focus:outline-none disabled:opacity-40 cursor-pointer"
        >
          <option value="">чч</option>
          {availableHours.map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <span className="text-text font-bold text-lg leading-none">:</span>

        <select
          value={selectedMinute ?? ""}
          onChange={(e) => handleMinuteChange(Number(e.target.value))}
          disabled={selectedHour === null}
          className="bg-white border border-secondary/40 rounded-lg px-2 py-1.5 text-sm text-text focus:border-accent focus:outline-none disabled:opacity-40 cursor-pointer"
        >
          <option value="">мм</option>
          {availableMinutes.map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* ── Selected value summary ── */}
      {value && (
        <div className="border-t border-secondary/20 px-4 py-2 text-sm text-center bg-background">
          Выбрано: <span className="font-semibold text-accent">{value}</span>
        </div>
      )}
    </div>
  );
}
