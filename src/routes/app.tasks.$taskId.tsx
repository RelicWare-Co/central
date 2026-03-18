import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { TaskEditorForm } from '#/components/task-editor-form'
import { TaskSubtasksPanel } from '#/components/task-subtasks-panel'
import {
  getTaskEditorReturnLink,
  validateTaskEditorSearch,
} from '#/lib/task-editor-routing'
import {
  getTaskById,
  getTaskFormOptions,
  getTaskFormValues,
  listSubtasksForTask,
  updateTask,
} from '#/lib/tasks'

export const Route = createFileRoute('/app/tasks/$taskId')({
  validateSearch: validateTaskEditorSearch,
  loader: async ({ context, location, params }) => {
    const normalizedSearch = validateTaskEditorSearch(location.search)
    const [task, options, subtasks] = await Promise.all([
      getTaskById(context.auth, params.taskId, `/app/tasks/${params.taskId}`),
      getTaskFormOptions(context.auth, `/app/tasks/${params.taskId}`),
      listSubtasksForTask(context.auth, params.taskId, `/app/tasks/${params.taskId}`),
    ])

    return {
      options: {
        ...options,
        projects: mergeProjectOption(options.projects, task),
        users: mergeUserOption(options.users, task),
      },
      search: normalizedSearch,
      subtasks,
      task,
    }
  },
  component: EditTaskRoute,
  notFoundComponent: MissingTaskRoute,
})

function EditTaskRoute() {
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const { options, search, subtasks, task } = Route.useLoaderData()
  const cancelLink = getTaskEditorReturnLink(
    search,
    search.projectId ?? task.project,
  )

  return (
    <TaskEditorForm
      cancelAction={
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 border-[rgba(255,255,255,0.14)] bg-transparent px-5 text-[0.74rem] uppercase tracking-[0.24em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
          asChild
        >
          <Link {...cancelLink}>Cancel</Link>
        </Button>
      }
      description="Adjust ownership, timing and state without losing the project or list context you came from."
      eyebrow="Task Detail"
      initialValues={getTaskFormValues(task)}
      options={options}
      submitLabel="Save Task"
      title="Edit Task"
      onSubmit={async (values) => {
        await updateTask(task.id, values, task.completedAt)

        await router.invalidate()
        await navigate(getTaskEditorReturnLink(search, values.project || task.project))
      }}
    >
      <TaskSubtasksPanel initialSubtasks={subtasks} taskId={task.id} />
    </TaskEditorForm>
  )
}

function MissingTaskRoute() {
  return (
    <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
        Task Detail
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        Task Not Found
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
        This task no longer exists or your session cannot access it.
      </p>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-5 h-12 border-[rgba(255,255,255,0.14)] bg-transparent px-5 text-[0.74rem] uppercase tracking-[0.24em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
        asChild
      >
        <Link to="/app/my-tasks">Back to My Tasks</Link>
      </Button>
    </section>
  )
}

function mergeProjectOption<
  TProject extends { id: string; name?: string; slug?: string; status?: string },
>(projects: TProject[], task: { expand?: { project?: TProject } }) {
  const project = task.expand?.project

  if (!project || projects.some((item) => item.id === project.id)) {
    return projects
  }

  return [project, ...projects]
}

function mergeUserOption<TUser extends { email?: string; id: string; name?: string; role?: string }>(
  users: TUser[],
  task: { expand?: { assignee?: TUser } },
) {
  const assignee = task.expand?.assignee

  if (!assignee || users.some((item) => item.id === assignee.id)) {
    return users
  }

  return [assignee, ...users]
}
