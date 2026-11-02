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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent, CalendarViewMode, CalendarEventType } from '../../types/calendar';
import { useAuthStore } from '../../store/authStore';

export const DashboardCalendarCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Timezone & Today
  const todayIST = useMemo(() => calendarService.getCurrentDateInTimezone('Asia/Kolkata'), []);

  const [currentYear, setCurrentYear] = useState(todayIST.year);
  const [currentMonth, setCurrentMonth] = useState(todayIST.month); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayIST.dateString);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

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
    events.forEach((ev) => {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    });
    return map;
  }, [events]);

  // Events on the currently selected date
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  // Event type visual helpers
  const getEventBadge = (type: CalendarEventType) => {
    switch (type) {
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
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          icon: <ArrowRightLeft className="w-3 h-3 text-emerald-500" />,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
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
            Real milestone ledger: due invoices, scheduled deliveries, order deadlines & local reminders
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
                            handleEventClick(ev);
                          }}
                          className={`text-[9.5px] sm:text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-1 hover:brightness-110 transition-all ${badge.bg}`}
                          title={`${badge.label}: ${ev.title}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                          <span className="truncate">{ev.title}</span>
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
                            handleEventClick(ev);
                          }}
                          className={`p-1.5 rounded-xl border text-[11px] hover:brightness-110 transition-all ${badge.bg}`}
                          title={ev.title}
                        >
                          <div className="flex items-center gap-1 font-semibold truncate">
                            {badge.icon}
                            <span className="truncate">{ev.title}</span>
                          </div>
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
                {selectedDateStr === todayIST.dateString ? 'Today • ' : ''}Focused Date View
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

          <div className="space-y-2.5">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((ev) => {
                const badge = getEventBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3 shadow-sm hover:border-brand-orange/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${badge.bg}`}>
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F2F4F8] truncate">
                            {ev.title}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{ev.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ev.linkedPath ? (
                        <button
                          onClick={() => navigate(ev.linkedPath!)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange hover:text-white transition-colors flex items-center gap-1.5"
                          title="Open linked system record"
                        >
                          <span>Open Record</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditReminder(ev)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Reminder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CalendarDays className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No scheduled milestones or reminders on this date.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click "+ New Reminder for Date" to log an operational follow-up.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Day Agenda Drawer when in Month View */}
      {viewMode === 'month' && selectedDayEvents.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Agenda for {new Date(selectedDateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} ({selectedDayEvents.length} items)
            </span>
            <button
              onClick={() => handleOpenAddReminder(selectedDateStr)}
              className="text-xs text-brand-orange hover:underline font-semibold"
            >
              + Add Reminder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedDayEvents.map((ev) => {
              const badge = getEventBadge(ev.type);
              return (
                <div
                  key={ev.id}
                  onClick={() => handleEventClick(ev)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01] ${badge.bg}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {badge.icon}
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{ev.title}</p>
                      {ev.description && (
                        <p className="text-[10px] opacity-80 truncate">{ev.description}</p>
                      )}
                    </div>
                  </div>
                  {ev.linkedPath ? (
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-75" />
                  ) : (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReminder(ev.id);
                        }}
                        className="p-1 hover:text-rose-500 transition-colors"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Persistence Note Footer */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
          <span>Milestones are generated dynamically from live invoices, purchase orders and transfers.</span>
        </div>
        <span className="hidden sm:inline text-slate-500">Local terminal persistence</span>
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
