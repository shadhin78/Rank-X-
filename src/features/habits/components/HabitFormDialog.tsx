import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Check, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { CustomHabit, HabitType } from '@/src/types';

interface HabitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CustomHabit, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: CustomHabit | null;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const TEMPLATES: Array<{
  name: string;
  description: string;
  type: HabitType;
  targetValue: any;
  unit: string;
  pointValue: number;
  activeDays: number[];
}> = [
  {
    name: 'Wake Up',
    description: 'Wake up early to begin the morning with clear mental focus.',
    type: 'time',
    targetValue: '06:30',
    unit: '',
    pointValue: 5,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: 'Study',
    description: 'Deep focus study block dedicated to core academic curriculum.',
    type: 'duration',
    targetValue: 4,
    unit: 'hours',
    pointValue: 10,
    activeDays: [1, 2, 3, 4, 5],
  },
  {
    name: 'Salat',
    description: 'Perform the five daily obligatory prayers on time.',
    type: 'count',
    targetValue: 5,
    unit: 'prayers',
    pointValue: 10,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: 'Exercise',
    description: 'Physical training, gym workout, or cardio session.',
    type: 'duration',
    targetValue: 30,
    unit: 'minutes',
    pointValue: 5,
    activeDays: [1, 2, 3, 4, 5, 6],
  },
  {
    name: 'Reading',
    description: 'Read academic or technical literature.',
    type: 'number',
    targetValue: 20,
    unit: 'pages',
    pointValue: 5,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: 'Water Hydration',
    description: 'Drink sufficient water throughout study sessions.',
    type: 'count',
    targetValue: 8,
    unit: 'glasses',
    pointValue: 5,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  },
];

export function HabitFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: HabitFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<HabitType>('duration');
  const [targetValue, setTargetValue] = useState<any>('30');
  const [unit, setUnit] = useState('minutes');
  const [pointValue, setPointValue] = useState(5);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setType(initialData.type);
      setTargetValue(initialData.targetValue);
      setUnit(initialData.unit || '');
      setPointValue(initialData.pointValue);
      setActiveDays(initialData.activeDays || [0, 1, 2, 3, 4, 5, 6]);
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialData.endDate || '');
      setIsActive(initialData.isActive !== false);
    } else {
      setName('');
      setDescription('');
      setType('duration');
      setTargetValue('30');
      setUnit('minutes');
      setPointValue(5);
      setActiveDays([0, 1, 2, 3, 4, 5, 6]);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setIsActive(true);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setType(tpl.type);
    setTargetValue(tpl.targetValue);
    setUnit(tpl.unit);
    setPointValue(tpl.pointValue);
    setActiveDays(tpl.activeDays);
  };

  const handleTypeChange = (newType: HabitType) => {
    setType(newType);
    switch (newType) {
      case 'time':
        setTargetValue('06:30');
        setUnit('');
        break;
      case 'duration':
        setTargetValue('30');
        setUnit('minutes');
        break;
      case 'count':
        setTargetValue('5');
        setUnit('times');
        break;
      case 'number':
        setTargetValue('10');
        setUnit('items');
        break;
      case 'boolean':
      case 'checkbox':
        setTargetValue(true);
        setUnit('');
        break;
    }
  };

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      if (activeDays.length === 1) return; // Must have at least 1 day
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a habit name');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        type,
        targetValue,
        unit: unit.trim(),
        pointValue: Number(pointValue) || 5,
        activeDays,
        startDate,
        endDate: endDate ? endDate : null,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {initialData ? 'Edit Habit' : 'Create Custom Habit'}
            </h2>
            <p className="text-xs text-zinc-500">
              Define target goals, measurement types, and schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Templates (only when creating) */}
        {!initialData && (
          <div className="mt-3 mb-4">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              placeholder="e.g. Deep Study, Salat, Wake Up..."
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              placeholder="e.g. 4 hours focused on accounting syllabus"
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Habit Type Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Habit Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(
                ['boolean', 'checkbox', 'number', 'duration', 'count', 'time'] as HabitType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`min-h-[38px] rounded-xl text-xs font-medium capitalize border transition-all ${
                    type === t
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Target Value & Unit Input Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50/70 border border-zinc-100 dark:bg-zinc-800/40 dark:border-zinc-800">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Target Value
              </label>

              {type === 'time' && (
                <input
                  type="time"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              )}

              {type === 'duration' && (
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              )}

              {(type === 'count' || type === 'number') && (
                <input
                  type="number"
                  min="1"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              )}

              {(type === 'boolean' || type === 'checkbox') && (
                <div className="h-10 flex items-center px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Single Tap Completion
                </div>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Measurement Unit
              </label>
              {type === 'duration' ? (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                </select>
              ) : (
                <input
                  type="text"
                  disabled={type === 'boolean' || type === 'checkbox' || type === 'time'}
                  value={unit}
                  placeholder={
                    type === 'count'
                      ? 'e.g. prayers, reps'
                      : type === 'number'
                      ? 'e.g. pages, problems'
                      : 'N/A'
                  }
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              )}
            </div>
          </div>

          {/* Point Value */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between mb-1">
              <span>Point Value (Reward)</span>
              <span className="text-[11px] text-zinc-400">Awarded upon completion</span>
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setPointValue(pts)}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-colors ${
                    pointValue === pts
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  +{pts} pts
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="100"
                value={pointValue}
                onChange={(e) => setPointValue(Number(e.target.value) || 5)}
                className="h-9 w-20 text-center rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Active Days */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Active Schedule
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDays([0, 1, 2, 3, 4, 5, 6])}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Everyday
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setActiveDays([1, 2, 3, 4, 5])}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Weekdays
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setActiveDays([0, 6])}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = activeDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`h-10 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates & Active Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : initialData
                ? 'Update Habit'
                : 'Create Habit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
