import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Link2, CheckSquare, Sparkles, Percent, Trash2 } from "lucide-react";
import { PlannerEntry, TaskStore, HabitStore, Task, Habit, PlannerStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/shamsi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry: PlannerEntry | null;
  onSave: (taskId: string | null, habitId: string | null, customThreshold: number | null) => void;
}

export default function PlannerLinkModal({ isOpen, onClose, entry, onSave }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [thresholdInput, setThresholdInput] = useState<string>("");

  const globalThreshold = PlannerStore.getGlobalThreshold();

  useEffect(() => {
    if (isOpen && entry) {
      setTasks(TaskStore.list());
      setHabits(HabitStore.list());
      setSelectedTaskId(entry.task_id || "");
      setSelectedHabitId(entry.habit_id || "");
      setThresholdInput(
        entry.custom_threshold !== undefined && entry.custom_threshold !== null
          ? entry.custom_threshold.toString()
          : ""
      );
    }
  }, [isOpen, entry]);

  if (!isOpen || !entry) return null;

  const handleSave = () => {
    const customThreshold = thresholdInput.trim() !== "" ? parseInt(thresholdInput, 10) : null;
    const validatedThreshold = customThreshold !== null && !isNaN(customThreshold)
      ? Math.max(10, Math.min(100, customThreshold))
      : null;

    onSave(
      selectedTaskId ? selectedTaskId : null,
      selectedHabitId ? selectedHabitId : null,
      validatedThreshold
    );
    onClose();
  };

  const handleClearLinks = () => {
    onSave(null, null, null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md rounded-3xl bg-[#18181b] border border-zinc-800 shadow-2xl p-5 text-right overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* هدر مدال */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">اتصال بازه به تسک و عادت</h3>
                <span className="text-[11px] text-zinc-400">
                  بازه: <b className="text-amber-400 font-mono">{toPersianDigits(entry.time_slot)}</b>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 px-0.5 py-1">
            {/* ۱. اتصال به تسک */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                <span>اتصال به تسک (مدیریت تسک و کانبان)</span>
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- بدون اتصال به تسک --</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} {task.status === "done" ? "(انجام‌شده)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 leading-tight">
                با اتمام این بازه در پلنر، تسک متصل خودکار در کانبان و مدیریت تسک «انجام‌شده» خواهد شد.
              </p>
            </div>

            {/* ۲. اتصال به عادت */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>اتصال به عادت (ردیاب عادت)</span>
              </label>
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">-- بدون اتصال به عادت --</option>
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 leading-tight">
                با رسیدن عملکرد به حد نصاب زمانی، تیک عادت برای تاریخ امروز خودکار زده می‌شود.
              </p>
            </div>

            {/* ۳. درصد حد نصاب اختصاصی */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-emerald-400" />
                  <span>درصد اختصاصی این بازه</span>
                </label>
                <span className="text-[10px] text-zinc-400">
                  پیش‌فرض کل: <b className="text-emerald-400 font-mono">{toPersianDigits(globalThreshold)}٪</b>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  placeholder={`خالی = استفاده از پیش‌فرض کل (${toPersianDigits(globalThreshold)}٪)`}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
                />
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                مثال: اگر در ایام امتحانات ۵۰ درصد زمان کارکرد برای این بازه کافی است، عدد ۵۰ را بنویسید.
              </p>
            </div>
          </div>

          {/* دکمه‌های پایین */}
          <div className="flex items-center gap-2 pt-4 border-t border-zinc-800 mt-2">
            {(entry.task_id || entry.habit_id || entry.custom_threshold) && (
              <button
                type="button"
                onClick={handleClearLinks}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                title="حذف اتصال‌ها"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>قطع اتصال</span>
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>ذخیره اتصال</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
