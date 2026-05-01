export type TaskType = 'project' | 'task' | 'activity';
export type ColumnKey = 'actively-working' | 'working-now' | 'activities';
export type Priority = 'low' | 'medium' | 'high';

export interface TimeLogEntry {
  date: string;
  seconds: number;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  timeSpent?: number;
}

export interface Observation {
  date: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  column: ColumnKey | 'completed';
  progress: number;
  timeSpent: number;
  priority: Priority;
  createdAt: string;
  completedAt?: string;
  deadline?: string;
  startDate?: string;
  description?: string;
  activityType?: string;
  timeLog: TimeLogEntry[];
  subtasks: Subtask[];
  observations: Observation[];
}

export interface TimerState {
  taskId: string;
  subtaskId: string | null;
  accumulated: number;
  startTime: number;
}

export interface AppState {
  tasks: Task[];
  timers: {
    project: TimerState | null;
    activity: TimerState | null;
    [key: string]: TimerState | null;
  };
  selectedSubtasks: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number;
}
