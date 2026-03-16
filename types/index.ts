export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type EffortEstimate = 'MINS_15' | 'MINS_30' | 'HOUR_1' | 'HOURS_3' | 'HALF_DAY' | 'FULL_DAY';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  quadrant: Quadrant;
  isImportant: boolean;
  isUrgent: boolean;
  effortEstimate?: EffortEstimate;
  deadline?: string; // ISO date string
  tags?: string[];
  aiSuggestedQuadrant?: Quadrant;
  aiQuadrantReason?: string;
  createdByAi: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  statusUpdatedAt?: string;
}

export type TaskLogEntry = {
  id: string;
  userId: string;
  originalTaskId: string;
  title: string;
  description?: string;
  quadrant?: string;
  priority?: string;
  status: string;
  effortEstimate?: string;
  deadline?: string;
  tags?: string[];
  completedAt?: string;
  autoDeletedAt?: string;
  createdAt: string;
}

export type ActivityLogResponse = {
  logs: TaskLogEntry[];
  totalCount: number;
  autoCleanupDays: number;
  message: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
