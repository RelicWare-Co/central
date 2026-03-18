import type { RecordModel } from 'pocketbase'
import { isPast, isToday, parseISO } from 'date-fns'
import { redirect } from '@tanstack/react-router'
import type { AuthContext } from '#/lib/auth'
import type { ProjectRecord } from '#/lib/projects'
import { pb } from '#/lib/pocketbase'

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'canceled'

export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskUser = RecordModel & {
  email?: string
  name?: string
  role?: string
  username?: string
}

export type TaskRecord = RecordModel & {
  assignee?: string
  blockedReason?: string
  completedAt?: string
  createdBy?: string
  description?: string
  dueDate?: string
  isArchived?: boolean
  priority: TaskPriority
  project?: string
  startDate?: string
  status: TaskStatus
  title: string
  expand?: {
    assignee?: TaskUser
    createdBy?: TaskUser
    project?: Pick<ProjectRecord, 'id' | 'name' | 'slug' | 'status'>
  }
}

export type TaskCollectionData = {
  items: TaskRecord[]
  summary: {
    blocked: number
    completed: number
    dueToday: number
    inProgress: number
    overdue: number
    total: number
  }
}

export async function listInboxTasks(auth: AuthContext) {
  return listTasks(auth, {
    filter: "(project = '' || project = null)",
    redirectTo: '/app/inbox',
  })
}

export async function listMyTasks(auth: AuthContext) {
  const userId = auth.getState().user?.id

  if (!userId) {
    auth.logout()

    throw redirect({
      to: '/login',
      search: {
        redirect: '/app/my-tasks',
      },
    })
  }

  return listTasks(auth, {
    filter: pb.filter('assignee = {:assignee}', { assignee: userId }),
    redirectTo: '/app/my-tasks',
  })
}

async function listTasks(
  auth: AuthContext,
  options: {
    filter: string
    redirectTo: string
  },
) {
  try {
    const items = await pb.collection('tasks').getFullList<TaskRecord>({
      expand: 'project,assignee,createdBy',
      filter: [
        '(isArchived = false || isArchived = null)',
        options.filter,
      ].join(' && '),
      sort: '+dueDate,+title',
    })

    return {
      items,
      summary: summarizeTasks(items),
    }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      auth.logout()

      throw redirect({
        to: '/login',
        search: {
          redirect: options.redirectTo,
        },
      })
    }

    throw error
  }
}

function summarizeTasks(items: TaskRecord[]): TaskCollectionData['summary'] {
  return items.reduce<TaskCollectionData['summary']>(
    (summary, task) => {
      summary.total += 1

      if (task.status === 'blocked') {
        summary.blocked += 1
      }

      if (task.status === 'completed') {
        summary.completed += 1
      }

      if (task.status === 'in_progress') {
        summary.inProgress += 1
      }

      if (task.dueDate) {
        const dueDate = parseISO(task.dueDate)

        if (!Number.isNaN(dueDate.getTime())) {
          const isOpenTask =
            task.status !== 'completed' && task.status !== 'canceled'

          if (isOpenTask && isToday(dueDate)) {
            summary.dueToday += 1
          }

          if (isOpenTask && isPast(dueDate) && !isToday(dueDate)) {
            summary.overdue += 1
          }
        }
      }

      return summary
    },
    {
      blocked: 0,
      completed: 0,
      dueToday: 0,
      inProgress: 0,
      overdue: 0,
      total: 0,
    },
  )
}

function isUnauthorizedError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  )
}
