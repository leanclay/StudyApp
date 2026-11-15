import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const expectedWorks = {
  ot: 39,
  nt: 27,
  bofm: 15,
  dc: 1,
  pgp: 5,
}

const nonScriptureAssignments = new Set([
  'easter',
  'christmas',
  'introduction to the old testament',
  'the family a proclamation to the world',
  'the restoration of the fulness of the gospel of jesus christ',
])

function normalizeText(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildBookMatcher(name) {
  const normalized = name.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-').trim()
  const pattern = normalized.split(/\s+/).map(escapeRegExp).join('\\s+')
  return new RegExp(`^${pattern}(?=\\s|$)`, 'i')
}

function getBookCandidates(canon) {
  return canon.works.flatMap((work) => work.books.flatMap((book) => (
    [book.name, ...book.aliases].map((name) => ({
      book,
      work,
      matcher: buildBookMatcher(name),
    }))
  ))).sort((left, right) => right.matcher.source.length - left.matcher.source.length)
}

function expandShortRange(startText, endText) {
  const start = Number(startText)
  let end = Number(endText)
  if (end < start && endText.length < startText.length) {
    const prefix = startText.slice(0, startText.length - endText.length)
    end = Number(`${prefix}${endText}`)
    if (end < start) end += 10 ** endText.length
  }
  return end
}

function parseChapterRange(value, book, context) {
  const match = value.match(/^(\d+)(?:\s*-\s*(\d+))?(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!match) throw new Error(`${context}: unrecognized reference "${value}"`)

  const startChapter = Number(match[1])
  const endChapter = match[2] ? expandShortRange(match[1], match[2]) : startChapter
  const startVerse = match[3] ? Number(match[3]) : undefined
  const endVerse = match[4]
    ? expandShortRange(match[3], match[4])
    : startVerse

  if (match[2] && startVerse !== undefined) {
    throw new Error(`${context}: verse ranges cannot span chapters in "${value}"`)
  }
  if (startChapter < 1 || endChapter > book.verseCounts.length || endChapter < startChapter) {
    throw new Error(`${context}: chapter/section range is outside ${book.name}: "${value}"`)
  }
  if (startVerse !== undefined) {
    const maximumVerse = book.verseCounts[startChapter - 1]
    if (startVerse < 1 || endVerse < startVerse || endVerse > maximumVerse) {
      throw new Error(`${context}: verse range is outside ${book.name} ${startChapter}: "${value}"`)
    }
  }

  return {
    bookId: book.id,
    startChapter,
    endChapter,
    startVerse,
    endVerse,
  }
}

export function parseReadingAssignment(canon, reading, context = 'reading assignment') {
  const candidates = getBookCandidates(canon)
  const normalizedReading = normalizeText(reading)
  if (normalizedReading === 'the articles of faith and official declarations 1 and 2') {
    const articles = canon.works.find((work) => work.id === 'pgp')
      ?.books.find((book) => book.name === 'Articles of Faith')
    const covenants = canon.works.find((work) => work.id === 'dc')
      ?.books.find((book) => book.name === 'Doctrine and Covenants')
    if (!articles || !covenants?.additionalDocuments?.includes('Official Declaration 1')
      || !covenants.additionalDocuments.includes('Official Declaration 2')) {
      throw new Error(`${context}: required canon metadata for Articles of Faith or Official Declarations is missing`)
    }
    return [{
      bookId: articles.id,
      startChapter: 1,
      endChapter: articles.verseCounts.length,
    }]
  }
  if (nonScriptureAssignments.has(normalizedReading)) return []

  const references = []
  let previousBook
  for (const rawSegment of reading.split(';')) {
    const segment = rawSegment.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-').trim()
    let book
    let remainder

    for (const candidate of candidates) {
      const match = segment.match(candidate.matcher)
      if (match) {
        book = candidate.book
        remainder = segment.slice(match[0].length).trim()
        break
      }
    }

    if (!book && previousBook && /^\d/.test(segment)) {
      book = previousBook
      remainder = segment
    }
    if (!book) throw new Error(`${context}: unknown scripture book in "${segment}"`)

    previousBook = book
    if (!remainder) {
      references.push({
        bookId: book.id,
        startChapter: 1,
        endChapter: book.verseCounts.length,
      })
    } else {
      references.push(parseChapterRange(remainder, book, context))
    }
  }
  return references
}

export function validateCanon(canon) {
  if (!Array.isArray(canon.works) || canon.works.length !== Object.keys(expectedWorks).length) {
    throw new Error('Canon must contain all five standard works')
  }
  if (canon.includesScriptureText !== false) {
    throw new Error('Scripture metadata must not contain scripture text')
  }

  const bookIds = new Set()
  let totalBooks = 0
  for (const [workId, expectedBookCount] of Object.entries(expectedWorks)) {
    const work = canon.works.find((item) => item.id === workId)
    if (!work || work.books.length !== expectedBookCount) {
      throw new Error(`${workId} must contain ${expectedBookCount} book record(s)`)
    }
    for (const book of work.books) {
      if (bookIds.has(book.id)) throw new Error(`Duplicate canon book id: ${book.id}`)
      bookIds.add(book.id)
      totalBooks += 1
      if (!book.name || !Array.isArray(book.verseCounts) || book.verseCounts.length === 0) {
        throw new Error(`${book.id} is missing its name or chapter/section metadata`)
      }
      if (!book.verseCounts.every((count) => Number.isInteger(count) && count > 0)) {
        throw new Error(`${book.id} has invalid chapter/section verse counts`)
      }
    }
  }

  const covenants = canon.works.find((work) => work.id === 'dc').books[0]
  if (covenants.verseCounts.length !== 138
    || !covenants.additionalDocuments?.includes('Official Declaration 1')
    || !covenants.additionalDocuments.includes('Official Declaration 2')) {
    throw new Error('Doctrine and Covenants must include 138 sections and both Official Declarations')
  }

  return { works: canon.works.length, books: totalBooks }
}

export function validateCurricula(canon, curricula) {
  if (!Array.isArray(curricula.years) || curricula.years.length !== 2) {
    throw new Error('Curricula must contain the approved 2025 and 2026 schedules')
  }

  const summaries = []
  for (const year of curricula.years) {
    if (!['2025', '2026'].includes(String(year.year)) || year.weeks.length !== 52) {
      throw new Error(`${year.year}: schedule must contain 52 weeks`)
    }
    let previousEnd
    for (const [index, week] of year.weeks.entries()) {
      const context = `${year.year} week ${index + 1}`
      if (week.number !== index + 1 || !week.reading.trim()) {
        throw new Error(`${context}: missing number or reading`)
      }
      for (const date of [week.startDate, week.endDate]) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
          || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
          throw new Error(`${context}: invalid ISO date "${date}"`)
        }
      }
      const start = Date.parse(`${week.startDate}T00:00:00Z`)
      const end = Date.parse(`${week.endDate}T00:00:00Z`)
      if (end - start !== 6 * 24 * 60 * 60 * 1000
        || new Date(start).getUTCDay() !== 1) {
        throw new Error(`${context}: lesson dates must cover Monday through Sunday`)
      }
      if (previousEnd && start !== previousEnd + 24 * 60 * 60 * 1000) {
        throw new Error(`${context}: lesson weeks must be contiguous`)
      }
      previousEnd = end
      parseReadingAssignment(canon, week.reading, context)
    }
    summaries.push({ year: year.year, weeks: year.weeks.length })
  }
  if (curricula.years[0].year !== 2025 || curricula.years[1].year !== 2026) {
    throw new Error('Curriculum years must be ordered 2025, then 2026')
  }
  return summaries
}

async function main() {
  const canon = JSON.parse(await readFile(new URL('../src/data/scripture-metadata.json', import.meta.url), 'utf8'))
  const curricula = JSON.parse(await readFile(new URL('../src/data/curricula.json', import.meta.url), 'utf8'))
  const canonSummary = validateCanon(canon)
  const curriculumSummary = validateCurricula(canon, curricula)
  const schedules = curriculumSummary.map(({ year, weeks }) => `${year}: ${weeks} weeks`).join(', ')
  console.log(`Validated ${canonSummary.works} standard works and ${canonSummary.books} books; ${schedules}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
