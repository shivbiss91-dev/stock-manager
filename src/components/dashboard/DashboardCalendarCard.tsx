import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileText,
  Truck,
  ArrowRightLeft,
  Bell,
  Trash2,
  ExternalLink,
  Edit2,
  Info,
  CalendarDays,
  Package,
  Boxes,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent, CalendarViewMode, CalendarEventType } from '../../types/calendar';
import { useAuthStore } from '../../store/authStore';

type EventFilterType = 'all' | 'stock' | 'business' | 'reminder';

export const DashboardCalendarCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Timezone & Today
  const todayIST = useMemo(() => calendarService.getCurrentDateInTimezone('Asia/Kolkata'), []);

  const [currentYear, setCurrentYear] = useState(todayIST.year);
  const [currentMonth, setCurrentMonth] = useState(todayIST.month); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayIST.dateString);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [eventFilter, setEventFilter] = useState<EventFilterType>('all');

  // Events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add / Edit Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CalendarEvent | null>(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState(todayIST.dateString);
  const [reminderNotes, setReminderNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await calendarService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Filter events based on active category filter
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    if (eventFilter === 'stock') {
      return events.filter((e) => e.type === 'stock_change' || e.type === 'product_update');
    }
    if (eventFilter === 'business') {
      return events.filter((e) =>
        ['invoice_due', 'purchase_expected', 'order_deadline', 'scheduled_transfer'].includes(e.type)
      );
    }
    if (eventFilter === 'reminder') {
      return events.filter((e) => e.type === 'user_reminder');
    }
    return events;
  }, [events, eventFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: events.length,
      stock: events.filter((e) => e.type === 'stock_change' || e.type === 'product_update').length,
      business: events.filter((e) =>
        ['invoice_due', 'purchase_expected', 'order_deadline', 'scheduled_transfer'].includes(e.type)
      ).length,
      reminder: events.filter((e) => e.type === 'user_reminder').length,
    };
  }, [events]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayClick = () => {
    setCurrentYear(todayIST.year);
    setCurrentMonth(todayIST.month);
    setSelectedDateStr(todayIST.dateString);
  };

  // Month metadata
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Days in current month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of current month (0: Sun, 1: Mon, ..., 6: Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Map events by date YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    });
    return map;
  }, [filteredEvents]);

  // Events on the currently selected date
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  // Event type visual helpers
  const getEventBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'stock_change':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          icon: <Package className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Stock Change',
        };
      case 'product_update':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
          dot: 'bg-cyan-500',
          icon: <Boxes className="w-3.5 h-3.5 text-cyan-500" />,
          label: 'Item Entry',
        };
      case 'invoice_due':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
          icon: <FileText className="w-3 h-3 text-amber-500" />,
          label: 'Invoice Due',
        };
      case 'purchase_expected':
        return {
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
          dot: 'bg-blue-500',
          icon: <Truck className="w-3 h-3 text-blue-500" />,
          label: 'PO Delivery',
        };
      case 'order_deadline':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400',
          dot: 'bg-purple-500',
          icon: <Clock className="w-3 h-3 text-purple-500" />,
          label: 'Order Deadline',
        };
      case 'scheduled_transfer':
        return {
          bg: 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400',
          dot: 'bg-teal-500',
          icon: <ArrowRightLeft className="w-3 h-3 text-teal-500" />,
          label: 'Transfer',
        };
      case 'user_reminder':
      default:
        return {
          bg: 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange',
          dot: 'bg-brand-orange',
          icon: <Bell className="w-3 h-3 text-brand-orange" />,
          label: 'Reminder',
        };
    }
  };

  const handleOpenAddReminder = (dateToPreload?: string) => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDate(dateToPreload || selectedDateStr || todayIST.dateString);
    setReminderNotes('');
    setModalError(null);
    setIsReminderModalOpen(true);
  };

  const handleOpenEditReminder = (reminder: CalendarEvent) => {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderDate(reminder.date);
    setReminderNotes(reminder.description || '');
    setModalError(null);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) {
      setModalError('Reminder title is required.');
      return;
    }
    if (!reminderDate.trim()) {
      setModalError('Date is required.');
      return;
    }

    try {
      if (editingReminder) {
        await calendarService.updateReminder(editingReminder.id, {
          title: reminderTitle.trim(),
          date: reminderDate.trim(),
          description: reminderNotes.trim(),
        });
      } else {
        await calendarService.addReminder(
          {
            title: reminderTitle.trim(),
            date: reminderDate.trim(),
            description: reminderNotes.trim(),
          },
          user?.name || 'Administrator'
        );
      }
      await loadEvents();
      setIsReminderModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save reminder.');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await calendarService.deleteReminder(id);
      await loadEvents();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.linkedPath) {
      navigate(event.linkedPath);
    } else if (!event.isSystemEvent) {
      handleOpenEditReminder(event);
    }
  };

  // Week View calculation
  const weekDays = useMemo(() => {
    const selected = new Date(selectedDateStr);
    const dayOfWeek = selected.getDay(); // 0 is Sunday
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateString: str,
        dayNumber: d.getDate(),
        dayName: d.toLocaleString('en-IN', { weekday: 'short' }),
        events: eventsByDate.get(str) || [],
      });
    }
    return days;
  }, [selectedDateStr, eventsByDate]);

  return (
    <Card variant="glass" noPadding className="p-5 flex flex-col justify-between overflow-hidden shadow-xl">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-orange" />
              <span>Operations Calendar</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              Asia/Kolkata (IST)
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-[#9AA0AE] mt-0.5">
            Real-time ledger: stock movements, product entries, invoice due dates, deliveries & reminders
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1A1D26] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Today Button */}
          <button
            onClick={handleTodayClick}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Today
          </button>

          {/* Month Navigation Prev / Next */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-800 dark:text-[#F2F4F8] whitespace-nowrap min-w-[110px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Reminder Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddReminder()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Event Category Filter Bar */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-brand-orange" /> Filter:
        </span>
        <button
          onClick={() => setEventFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            eventFilter === 'all'
              ? 'bg-brand-orange text-white shadow-sm'
              : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          All Activity ({counts.all})
        </button>
        <button
          onClick={() => setEventFilter('stock')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            eventFilter === 'stock'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock & Products ({counts.stock})</span>
        </button>
        <button
          onClick={() => setEventFilter('business')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            eventFilter === 'business'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices & POs ({counts.business})</span>
        </button>
        <button
          onClick={() => setEventFilter('reminder')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            eventFilter === 'reminder'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Reminders ({counts.reminder})</span>
        </button>
      </div>

      {/* Main Calendar Viewport */}
      {viewMode === 'month' && (
        <div className="space-y-3">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-white/[0.04]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[70px] sm:min-h-[85px] rounded-xl bg-slate-50/40 dark:bg-white/[0.01] border border-transparent"
              />
            ))}

            {/* Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayIST.dateString;
              const isSelected = dateStr === selectedDateStr;
              const dayEvents = eventsByDate.get(dateStr) || [];

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-orange/10 border-brand-orange ring-1 ring-brand-orange/40'
                      : isToday
                      ? 'bg-slate-100 dark:bg-white/[0.05] border-brand-orange/40'
                      : 'bg-white dark:bg-[#12151D] border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-brand-orange text-white'
                          : isSelected
                          ? 'text-brand-orange'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Micro event indicators */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const badge = getEventBadge(ev.type);
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dateStr);
                            handleEventClick(ev);
                          }}
                          className={`text-[9.5px] sm:text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-1 hover:brightness-110 transition-all ${badge.bg}`}
                          title={`${ev.time ? `[${ev.time}] ` : ''}${badge.label}: ${ev.title}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                          <span className="truncate">
                            {ev.time ? `${ev.time.split(' ')[0]} ` : ''}{ev.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold pl-1 block">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
          {weekDays.map((w) => {
            const isToday = w.dateString === todayIST.dateString;
            const isSelected = w.dateString === selectedDateStr;

            return (
              <div
                key={w.dateString}
                onClick={() => setSelectedDateStr(w.dateString)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer min-h-[220px] flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-orange/10 border-brand-orange ring-1 ring-brand-orange/40'
                    : isToday
                    ? 'bg-slate-100 dark:bg-white/[0.05] border-brand-orange/40'
                    : 'bg-white dark:bg-[#12151D] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.04]">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">{w.dayName}</p>
                      <p className={`text-base font-extrabold ${isToday ? 'text-brand-orange' : 'text-slate-800 dark:text-white'}`}>
                        {w.dayNumber}
                      </p>
                    </div>
                    {w.events.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange">
                        {w.events.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-2.5">
                    {w.events.map((ev) => {
                      const badge = getEventBadge(ev.type);
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(w.dateString);
                            handleEventClick(ev);
                          }}
                          className={`p-1.5 rounded-xl border text-[11px] hover:brightness-110 transition-all ${badge.bg}`}
                          title={ev.title}
                        >
                          <div className="flex items-center gap-1 font-semibold truncate">
                            {badge.icon}
                            <span className="truncate">{ev.title}</span>
                          </div>
                          {ev.time && (
                            <p className="text-[10px] font-mono opacity-80 mt-0.5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{ev.time}</span>
                            </p>
                          )}
                          {ev.description && (
                            <p className="text-[10px] opacity-75 truncate mt-0.5">{ev.description}</p>
                          )}
                        </div>
                      );
                    })}
                    {w.events.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic pt-2">No milestones</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddReminder(w.dateString);
                  }}
                  className="mt-3 text-[10px] text-slate-400 hover:text-brand-orange flex items-center gap-1 font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Reminder</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
            <div>
              <p className="text-xs text-brand-orange font-bold uppercase tracking-wider">
                {selectedDateStr === todayIST.dateString ? 'Today • ' : ''}Detailed Ledger Timeline
              </p>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-[#F2F4F8]">
                {new Date(selectedDateStr).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAddReminder(selectedDateStr)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Reminder for Date
            </Button>
          </div>

          <div className="space-y-3">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((ev) => {
                const badge = getEventBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] shadow-sm hover:border-brand-orange/40 transition-colors space-y-2.5"
                  >
                    {/* Header: Badge, Title & Exact Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${badge.bg}`}>
                          {badge.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F2F4F8] truncate">
                              {ev.title}
                            </h5>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ev.time ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08]">
                            <Clock className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{ev.time}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">All Day</span>
                        )}

                        {ev.linkedPath ? (
                          <button
                            onClick={() => navigate(ev.linkedPath!)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange hover:text-white transition-colors flex items-center gap-1.5"
                            title="Open linked system record"
                          >
                            <span>Open Record</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditReminder(ev)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                              title="Edit Reminder"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                              title="Delete Reminder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rich Stock Change & Product Details */}
                    {ev.stockChangeDetails ? (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {ev.stockChangeDetails.delta !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[11px]">Quantity:</span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded font-mono ${
                                  ev.stockChangeDetails.delta > 0
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : ev.stockChangeDetails.delta < 0
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {ev.stockChangeDetails.delta > 0 ? `+${ev.stockChangeDetails.delta}` : ev.stockChangeDetails.delta}{' '}
                                {ev.stockChangeDetails.unit || 'PCS'}
                              </span>
                            </div>
                          )}

                          {ev.stockChangeDetails.previousStock !== undefined && ev.stockChangeDetails.newStock !== undefined && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400">Inventory Level:</span>
                              <span className="font-semibold">{ev.stockChangeDetails.previousStock}</span>
                              <span className="text-slate-400">➔</span>
                              <span className="font-bold text-brand-orange">
                                {ev.stockChangeDetails.newStock} {ev.stockChangeDetails.unit || 'PCS'}
                              </span>
                            </div>
                          )}

                          {ev.stockChangeDetails.itemSku && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-400">SKU:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300">{ev.stockChangeDetails.itemSku}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-white/[0.03]">
                          {ev.stockChangeDetails.reason && (
                            <span><strong>Reason:</strong> {ev.stockChangeDetails.reason}</span>
                          )}
                          {ev.stockChangeDetails.user && (
                            <span><strong>Logged By:</strong> {ev.stockChangeDetails.user}</span>
                          )}
                          {ev.stockChangeDetails.referenceNumber && (
                            <span><strong>Reference:</strong> {ev.stockChangeDetails.referenceNumber}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      ev.description && (
                        <p className="text-xs text-slate-400 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                          {ev.description}
                        </p>
                      )
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CalendarDays className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No inventory changes or operational milestones logged on this date.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click "+ New Reminder for Date" to log an operational follow-up.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Day Agenda Drawer (when in Month View) */}
      {viewMode === 'month' && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Activity for {new Date(selectedDateStr).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddReminder(selectedDateStr)}
              className="text-xs text-brand-orange hover:underline font-semibold"
            >
              + Add Reminder
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {selectedDayEvents.map((ev) => {
                const badge = getEventBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    onClick={() => handleEventClick(ev)}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01] ${badge.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {badge.icon}
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{ev.title}</p>
                          <span className="text-[9.5px] uppercase font-bold tracking-wider opacity-80">
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Time Badge */}
                      {ev.time && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/40 dark:bg-white/10 flex-shrink-0">
                          <Clock className="w-3 h-3 text-brand-orange" />
                          <span>{ev.time}</span>
                        </span>
                      )}
                    </div>

                    {/* Stock Detail or Description */}
                    {ev.stockChangeDetails ? (
                      <div className="text-[11px] pt-1 border-t border-white/10 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>
                            {ev.stockChangeDetails.previousStock !== undefined && ev.stockChangeDetails.newStock !== undefined
                              ? `Stock: ${ev.stockChangeDetails.previousStock} ➔ ${ev.stockChangeDetails.newStock} ${ev.stockChangeDetails.unit || 'PCS'}`
                              : ev.stockChangeDetails.reason}
                          </span>
                          {ev.stockChangeDetails.delta !== undefined && (
                            <span className="font-bold font-mono">
                              {ev.stockChangeDetails.delta > 0 ? `+${ev.stockChangeDetails.delta}` : ev.stockChangeDetails.delta}
                            </span>
                          )}
                        </div>
                        {ev.stockChangeDetails.user && (
                          <p className="text-[10px] opacity-75 truncate">
                            By {ev.stockChangeDetails.user} {ev.stockChangeDetails.reason ? `• ${ev.stockChangeDetails.reason}` : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      ev.description && (
                        <p className="text-[10.5px] opacity-80 truncate pt-1 border-t border-white/10">
                          {ev.description}
                        </p>
                      )
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <span className="opacity-70">
                        {ev.stockChangeDetails?.referenceNumber || (ev.isSystemEvent ? 'System Record' : 'User Reminder')}
                      </span>
                      {ev.linkedPath ? (
                        <span className="flex items-center gap-1 font-semibold text-brand-orange">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReminder(ev.id);
                          }}
                          className="hover:text-rose-500 transition-colors"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.06] text-center text-xs text-slate-400">
              <span>No stock changes or milestones recorded for this date. </span>
              <button
                onClick={() => handleOpenAddReminder(selectedDateStr)}
                className="text-brand-orange font-semibold hover:underline"
              >
                Click to add an operational reminder
              </button>
            </div>
          )}
        </div>
      )}

      {/* Persistence Note Footer */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
          <span>Real-time sync: stock adjustments, product entries, invoice milestones & deliveries appear automatically.</span>
        </div>
        <span className="hidden sm:inline text-slate-500">Asia/Kolkata (IST)</span>
      </div>

      {/* Add / Edit Reminder Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title={editingReminder ? 'Edit Operational Reminder' : 'Add Calendar Reminder'}
      >
        <form onSubmit={handleSaveReminder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="e.g. Follow up on Card Holder dispatch / Audit physical stock"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date * (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Description (Optional)
            </label>
            <textarea
              rows={3}
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              placeholder="Provide context or instructions for this milestone..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
            />
          </div>

          {modalError && (
            <p className="text-xs text-rose-500 font-medium">{modalError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReminderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingReminder ? 'Save Changes' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
