import React from 'react';
import type { Task } from '../types.js';
import { STATE } from '../stateBridge.js';
import {
  formatTime,
  formatDate,
  isOverdue,
  getActivityTypeLabel,
  formatTimeCompact,
  formatLogDate,
  formatRelativeTime,
  formatTimeOfDay,
} from '../../shared/utils.js';

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

interface Props {
  task: Task;
  /** True when rendered inside the completed section (reduces opacity, disables drag). */
  isCompleted: boolean;
}

export function TaskCard({ task, isCompleted }: Props) {
  const timer = STATE.timers[task.type] ?? null;
  const isActiveTimer = timer?.taskId === task.id;

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent =
    task.progress ||
    (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0);
  const isComplete = progressPercent === 100;

  const showCompletedBadge =
    task.column === 'completed' || (task.type === 'activity' && progressPercent === 100);
  const overdueClass = isOverdue(task.deadline) && !isComplete ? 'overdue' : '';
  const completeClass = isComplete ? 'complete' : '';

  const showTimer =
    (task.column === 'working-now' || task.column === 'activities') && !isComplete;
  const showSubtaskSelector = showTimer && task.type !== 'activity';

  const activeSubtask =
    isActiveTimer && timer?.subtaskId && timer.subtaskId !== 'none'
      ? task.subtasks.find((s) => s.id === timer!.subtaskId) ?? null
      : null;

  const savedSubId = STATE.selectedSubtasks[task.id];

  const timerSeconds = isActiveTimer
    ? timer!.accumulated + Math.floor((Date.now() - timer!.startTime) / 1000)
    : task.timeSpent;

  const cardClasses = [
    'task-card',
    overdueClass,
    completeClass,
    isActiveTimer ? 'active-timer' : '',
    isCompleted ? 'completed-in-accordion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const createdSrc = task.createdAt ?? task.startDate;

  return (
    <div
      className={cardClasses}
      draggable={!isComplete && !isCompleted}
      data-task-id={task.id}
    >
      <div className={`task-priority ${task.priority}`} />

      {showCompletedBadge && (
        <div className="task-completed-badge">
          <i className="fas fa-check-circle" /> Completada
        </div>
      )}

      <div className="task-header">
        <span className="task-title">{task.title}</span>
        <div className="task-menu-wrapper">
          <button
            className="task-menu-btn task-menu-toggle"
            data-action="toggle-task-menu"
            data-task-id={task.id}
            title="Opciones"
          >
            <i className="fas fa-ellipsis-v" />
          </button>
          <div className="task-dropdown" id={`task-dropdown-${task.id}`}>
            <button
              className="task-dropdown-item"
              data-action="edit-task"
              data-task-id={task.id}
            >
              <i className="fas fa-pencil-alt" /> Editar
            </button>
            {(task.column === 'completed' ||
              (task.type === 'activity' && task.progress === 100)) && (
              <button
                className="task-dropdown-item"
                data-action="reopen-task"
                data-task-id={task.id}
              >
                <i className="fas fa-undo" /> ¿No has terminado? Reabrir
              </button>
            )}
            <button
              className="task-dropdown-item danger"
              data-action="delete-task"
              data-task-id={task.id}
            >
              <i className="fas fa-trash" /> Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="task-meta">
        <span className={`priority-chip ${task.priority}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>

        {createdSrc && (
          <span
            className="task-meta-item"
            title={`Creada: ${new Date(
              task.createdAt ?? `${task.startDate}T00:00:00`,
            ).toLocaleString('es-ES')}`}
          >
            <i className="fas fa-history" />
            {formatRelativeTime(createdSrc)}
            {task.createdAt ? ` · ${formatTimeOfDay(task.createdAt)}` : ''}
          </span>
        )}

        {task.deadline && (
          <span className={['task-meta-item', overdueClass, completeClass].filter(Boolean).join(' ')}>
            <i className="fas fa-calendar" />
            {formatDate(task.deadline)}
          </span>
        )}

        <span className="task-meta-item">
          <i className="fas fa-clock" />
          {formatTime(task.timeSpent)}
        </span>

        {totalSubtasks > 0 && (
          <span className={['task-meta-item', completeClass].filter(Boolean).join(' ')}>
            <i className="fas fa-check-square" />
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}
      </div>

      {(totalSubtasks > 0 || task.progress > 0) && (
        <div className="task-progress">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-value">{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill${isComplete ? ' complete' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {showTimer && (
        <>
          {showSubtaskSelector && (
            <div className="subtask-selector">
              <label>Working on:</label>
              {isActiveTimer ? (
                <div className="active-subtask-name">
                  {activeSubtask ? (
                    activeSubtask.text
                  ) : (
                    <span className="no-subtask">— General task —</span>
                  )}
                </div>
              ) : (
                <select
                  data-action="select-subtask"
                  data-task-id={task.id}
                  defaultValue={savedSubId ?? 'none'}
                >
                  <option value="none">-- No specific subtask --</option>
                  {task.subtasks
                    .filter((s) => !s.completed)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.text}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}

          <div className="task-timer">
            <span
              className={`timer-display${isActiveTimer ? ' running' : ''}`}
              id={`timer-${task.id}`}
            >
              {formatTime(timerSeconds)}
            </span>
            <div className="timer-controls">
              {isActiveTimer ? (
                <>
                  <button
                    className="timer-btn pause"
                    data-action="pause-timer"
                    data-task-id={task.id}
                    title="Pause"
                  >
                    <i className="fas fa-pause" />
                  </button>
                  <button
                    className="timer-btn stop"
                    data-action="stop-timer"
                    data-task-id={task.id}
                    title="Finish"
                  >
                    <i className="fas fa-check" />
                  </button>
                </>
              ) : (
                <button
                  className="timer-btn start"
                  data-action="start-timer"
                  data-task-id={task.id}
                  title="Start"
                >
                  <i className="fas fa-play" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {task.type === 'activity' && (
        <div className="task-tags">
          <span className="task-tag">
            <i className="fas fa-tag" /> {getActivityTypeLabel(task.activityType)}
          </span>
        </div>
      )}

      {task.timeLog.length > 0 && (
        <div className="time-log">
          {[...task.timeLog]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((entry) => (
              <div key={entry.date} className="time-log-entry">
                <span className="time-log-date">{formatLogDate(entry.date)}</span>
                <span className="time-log-duration">{formatTimeCompact(entry.seconds)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
