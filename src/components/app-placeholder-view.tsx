import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'

type AppPlaceholderViewProps = {
  description: string
  eyebrow: string
  title: string
}

export function AppPlaceholderView({
  description,
  eyebrow,
  title,
}: AppPlaceholderViewProps) {
  return (
    <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
        {eyebrow}
      </p>

      <Empty className="mt-6 min-h-[360px] border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)]">
        <EmptyHeader>
          <EmptyTitle className="text-base uppercase tracking-[0.2em] text-white">
            {title}
          </EmptyTitle>
          <EmptyDescription className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
            {description}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  )
}
