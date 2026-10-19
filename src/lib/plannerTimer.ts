import { PlannerStore, PlannerEntry, TaskStore, HabitStore } from "./store";

export interface ActivePlannerTimer {
  entryId: string;
  date: string;
  timeSlot: string;
  subject: string;
  taskId?: string | null;
  taskTitle?: string;
  habitId?: string | null;
  habitName?: string;
  targetDurationMinutes: number; // ملاک زمان هدف: برنامه اصلی (اصلی ب)
  threshold: number;
  startedAt: number; // ms timestamp
  accumulatedSeconds: number;
}

const TIMER_KEY = "focusflow_active_planner_timer";

export const PlannerTimerService = {
  getActiveTimer(): ActivePlannerTimer | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  startTimer(entry: PlannerEntry, targetDurationMinutes: number): ActivePlannerTimer {
    const globalThreshold = PlannerStore.getGlobalThreshold();
    const threshold = (entry.custom_threshold !== undefined && entry.custom_threshold !== null)
      ? entry.custom_threshold
      : globalThreshold;

    let taskTitle = "";
    if (entry.task_id) {
      const task = TaskStore.list().find((t) => t.id === entry.task_id);
      if (task) {
        taskTitle = task.title;
        // فعال‌سازی تایمر تسک همگام با پلنر
        TaskStore.update(task.id, {
          status: "in_progress",
          kanban_column: "in_progress",
          timer_started_at: Date.now()
        });
      }
    }

    let habitName = "";
    if (entry.habit_id) {
      const habit = HabitStore.list().find((h) => h.id === entry.habit_id);
      if (habit) habitName = habit.name;
    }

    const timerState: ActivePlannerTimer = {
      entryId: entry.id,
      date: entry.date,
      timeSlot: entry.time_slot,
      subject: entry.subject || taskTitle || habitName || "فعالیت بدون عنوان",
      taskId: entry.task_id,
      taskTitle,
      habitId: entry.habit_id,
      habitName,
      targetDurationMinutes: targetDurationMinutes > 0 ? targetDurationMinutes : 60,
      threshold,
      startedAt: Date.now(),
      accumulatedSeconds: entry.elapsed_seconds || 0,
    };

    localStorage.setItem(TIMER_KEY, JSON.stringify(timerState));
    PlannerStore.update(entry.id, { timer_started_at: timerState.startedAt });

    window.dispatchEvent(new CustomEvent("focusflow-planner-timer-change", { detail: timerState }));
    window.dispatchEvent(new Event("focusflow-data-changed"));

    return timerState;
  },

  stopTimer(entryId?: string): { entry: PlannerEntry | null; percentage: number; isPassed: boolean } | null {
    const active = this.getActiveTimer();
    if (!active) return null;
    if (entryId && active.entryId !== entryId) return null;

    const elapsedNow = Math.floor((Date.now() - active.startedAt) / 1000);
    const totalSeconds = active.accumulatedSeconds + Math.max(0, elapsedNow);
    
    // استفاده از Math.floor تا دقایق ناقص (مثل ۴۵ ثانیه) به اشتباه به ۱ گرد نشوند
    const elapsedMinutes = Math.floor(totalSeconds / 60);

    // محاسبه دقیق ثانیه به ثانیه درصد پیشرفت بر مبنای زمان اصلی (اصلی ب)
    const targetSeconds = (active.targetDurationMinutes > 0 ? active.targetDurationMinutes : 60) * 60;
    const percentage = Math.min(100, Math.floor((totalSeconds / targetSeconds) * 100));
    const isPassed = percentage >= active.threshold;

    const entry = PlannerStore.get(active.entryId);
    let updatedEntry: PlannerEntry | null = null;

    if (entry) {
      // ثبت زمان در ستون عملکرد واقعی فقط اگر حداقل ۱ دقیقه کامل پر شده باشد
      const currentActual = parseInt(entry.actual_main || "0", 10) || 0;
      const finalActualMinutes = Math.max(currentActual, elapsedMinutes);

      updatedEntry = PlannerStore.update(active.entryId, {
        actual_main: finalActualMinutes > 0 ? finalActualMinutes.toString() : entry.actual_main,
        elapsed_seconds: totalSeconds,
        timer_started_at: null,
        is_checked: isPassed ? true : entry.is_checked,
      });

      if (updatedEntry && isPassed) {
        PlannerStore.syncTaskAndHabit(updatedEntry, true, active.date);
      }
    }

    // هماهنگ‌سازی و توقف هوشمند تایمر تسک متصل
    if (active.taskId) {
      const task = TaskStore.list().find((t) => t.id === active.taskId);
      if (task) {
        const taskBaseSeconds = task.elapsed_seconds || 0;
        const sessionSeconds = Math.max(0, elapsedNow);
        const updatedTaskSeconds = taskBaseSeconds + sessionSeconds;

        if (isPassed) {
          TaskStore.update(task.id, {
            status: "done",
            kanban_column: "done",
            completed_at: Date.now(),
            timer_started_at: null,
            elapsed_seconds: updatedTaskSeconds
          });
        } else {
          // اگر به حد نصاب نرسید: تسک به حالت در حال انتظار (todo) می‌رود و تایمرش متوقف می‌شود
          TaskStore.update(task.id, {
            status: "todo",
            kanban_column: "todo",
            timer_started_at: null,
            elapsed_seconds: updatedTaskSeconds
          });
        }
      }
    }

    localStorage.removeItem(TIMER_KEY);
    window.dispatchEvent(new CustomEvent("focusflow-planner-timer-change", { detail: null }));
    window.dispatchEvent(new Event("focusflow-data-changed"));

    return {
      entry: updatedEntry,
      percentage,
      isPassed
    };
  },

  cancelTimer(entryId?: string): void {
    const active = this.getActiveTimer();
    if (!active) return;
    if (entryId && active.entryId !== entryId) return;

    if (active.taskId) {
      TaskStore.update(active.taskId, {
        status: "todo",
        kanban_column: "todo",
        timer_started_at: null
      });
    }

    PlannerStore.update(active.entryId, { timer_started_at: null });
    localStorage.removeItem(TIMER_KEY);
    window.dispatchEvent(new CustomEvent("focusflow-planner-timer-change", { detail: null }));
    window.dispatchEvent(new Event("focusflow-data-changed"));
  }
};
