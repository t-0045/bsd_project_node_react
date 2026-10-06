const dateTimeFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export const formatDateTime = (value) => {
  if (!value) return 'ללא'

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value)

  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date)
}