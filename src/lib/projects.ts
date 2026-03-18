import type { RecordModel } from 'pocketbase'
import { redirect } from '@tanstack/react-router'
import type { AuthContext } from '#/lib/auth'
import { pb } from '#/lib/pocketbase'

export type ProjectStatus =
  | 'active'
  | 'paused'
  | 'blocked'
  | 'completed'
  | 'archived'

export type ProjectOwner = RecordModel & {
  email?: string
  name?: string
  role?: string
  username?: string
}

export type ProjectRecord = RecordModel & {
  description?: string
  dueDate?: string
  isArchived?: boolean
  name: string
  owner?: string
  slug: string
  startDate?: string
  status: ProjectStatus
  expand?: {
    owner?: ProjectOwner
  }
}

export type ProjectsSummary = {
  active: number
  blocked: number
  completed: number
  paused: number
  total: number
}

export async function listProjects(auth: AuthContext) {
  try {
    const items = await pb.collection('projects').getFullList<ProjectRecord>({
      expand: 'owner',
      filter: 'isArchived = false || isArchived = null',
      sort: '+dueDate,+name',
    })

    return {
      items,
      summary: items.reduce<ProjectsSummary>(
        (counts, project) => {
          counts.total += 1

          if (project.status === 'active') {
            counts.active += 1
          }

          if (project.status === 'blocked') {
            counts.blocked += 1
          }

          if (project.status === 'completed') {
            counts.completed += 1
          }

          if (project.status === 'paused') {
            counts.paused += 1
          }

          return counts
        },
        {
          active: 0,
          blocked: 0,
          completed: 0,
          paused: 0,
          total: 0,
        },
      ),
    }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      auth.logout()

      throw redirect({
        to: '/login',
        search: {
          redirect: '/app/projects',
        },
      })
    }

    throw error
  }
}

function isUnauthorizedError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  )
}
