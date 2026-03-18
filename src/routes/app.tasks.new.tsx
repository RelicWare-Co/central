import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { TaskEditorForm } from '#/components/task-editor-form'
import {
  getTaskEditorReturnLink,
  validateTaskEditorSearch,
} from '#/lib/task-editor-routing'
import {
  createTask,
  getDefaultTaskFormValues,
  getTaskFormOptions,
} from '#/lib/tasks'

export const Route = createFileRoute('/app/tasks/new')({
  validateSearch: validateTaskEditorSearch,
  loader: async ({ context, location }) => {
    const normalizedSearch = validateTaskEditorSearch(location.search)
    const options = await getTaskFormOptions(context.auth, '/app/tasks/new')

    return {
      defaults: getDefaultTaskFormValues(options.currentUserId, {
        project: normalizedSearch.projectId ?? '',
      }),
      options,
      search: normalizedSearch,
    }
  },
  component: NewTaskRoute,
})

function NewTaskRoute() {
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const { defaults, options, search } = Route.useLoaderData()
  const cancelLink = getTaskEditorReturnLink(search, search.projectId)

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
      description="Capture the next unit of work, keep state explicit and decide only the fields that matter now."
      eyebrow="New Task"
      initialValues={defaults}
      options={options}
      submitLabel="Create Task"
      title="Create a Task"
      onSubmit={async (values) => {
        const task = await createTask(options.currentUserId, values)

        await router.invalidate()
        await navigate(getTaskEditorReturnLink(search, values.project || task.project))
      }}
    />
  )
}
