import curriculumData from './curricula.json'
import scriptureMetadata from './scripture-metadata.json'

type CurriculumRecord = {
  number: number
  startDate: string
  endDate: string
  reading: string
}

export type ReadingWeek = {
  id: string
  year: number
  number: number
  startDate: string
  endDate: string
  dates: string
  startLabel: string
  endLabel: string
  title: string
}

const nonScriptureAssignments = new Set([
  'Easter',
  'Christmas',
  'Introduction to the Old Testament',
  'The Family: A Proclamation to the World',
  'The Restoration of the Fulness of the Gospel of Jesus Christ',
  'The Articles of Faith and Official Declarations 1 and 2',
])
const canonBookNames: string[] = []
for (const work of scriptureMetadata.works) {
  for (const book of work.books) {
    canonBookNames.push(book.name, ...book.aliases)
  }
}
canonBookNames.sort((left, right) => right.length - left.length)

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`)
}

function findBookName(segment: string) {
  const normalizedSegment = segment.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-').toLowerCase()
  return canonBookNames.find((name) => {
    const normalizedName = name.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-').toLowerCase()
    return normalizedSegment === normalizedName || normalizedSegment.startsWith(`${normalizedName} `)
  })
}

function getWeekDateLabels(startDate: string, endDate: string) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const year = end.getFullYear()
  const startLabel = monthDay.format(start)
  const endLabel = monthDay.format(end)

  if (start.getFullYear() !== end.getFullYear()) {
    return {
      dates: `${monthDay.format(start)}, ${start.getFullYear()} – ${endLabel}, ${year}`,
      startLabel: `${monthDay.format(start)}, ${start.getFullYear()}`,
      endLabel: `${endLabel}, ${year}`,
    }
  }
  if (start.getMonth() === end.getMonth()) {
    return {
      dates: `${month.format(start)} ${start.getDate()}–${end.getDate()}, ${year}`,
      startLabel: `${month.format(start)} ${start.getDate()}`,
      endLabel: `${month.format(end)} ${end.getDate()}`,
    }
  }
  return {
    dates: `${startLabel} – ${endLabel}, ${year}`,
    startLabel,
    endLabel,
  }
}

export const curriculumWeeks: ReadingWeek[] = curriculumData.years.flatMap((year) => (
  year.weeks.map((week: CurriculumRecord) => {
    const dateLabels = getWeekDateLabels(week.startDate, week.endDate)
    return {
      id: `${year.year}-${week.number}`,
      year: year.year,
      number: week.number,
      startDate: week.startDate,
      endDate: week.endDate,
      ...dateLabels,
      title: week.reading,
    }
  })
))

export function getWeekReferenceSuggestions(week: ReadingWeek) {
  if (nonScriptureAssignments.has(week.title)) return []

  let previousBook: string | undefined
  return week.title.split(';').map((rawSegment) => {
    const segment = rawSegment.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-').trim()
    const bookName = findBookName(segment)
    if (bookName) {
      previousBook = bookName
      return segment
    }
    if (previousBook && /^\d/.test(segment)) return `${previousBook} ${segment}`
    previousBook = undefined
    return segment
  })
}

export function getCurrentWeekIndex(today = new Date()) {
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  const containingWeek = curriculumWeeks.findIndex((week) => (
    week.startDate <= todayDate && week.endDate >= todayDate
  ))
  if (containingWeek >= 0) return containingWeek

  let priorWeek = -1
  for (const [index, week] of curriculumWeeks.entries()) {
    if (week.startDate <= todayDate) priorWeek = index
    else break
  }
  return Math.max(0, priorWeek)
}

export function getTodayLabels(today = new Date()) {
  return {
    long: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(today),
    short: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(today),
  }
}
