import { formatISO, isPast, isToday, parseISO } from 'date-fns'

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDateLabel(value?: string, fallback = 'No Date') {
  if (!value) {
    return fallback
  }

  const date = parseISO(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return shortDateFormatter.format(date)
}

export function formatDueDateLabel(value?: string) {
  if (!value) {
    return 'No Deadline'
  }

  const date = parseISO(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  if (isToday(date)) {
    return `Due Today · ${shortDateFormatter.format(date)}`
  }

  if (isPast(date)) {
    return `Overdue · ${shortDateFormatter.format(date)}`
  }

  return shortDateFormatter.format(date)
}

export function formatDateInputValue(value?: string) {
  if (!value) {
    return ''
  }

  const date = parseISO(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return formatISO(date, { representation: 'date' })
}

export function formatDateForPocketBase(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return `${trimmed}T12:00:00.000Z`
}
