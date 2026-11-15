import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  parseReadingAssignment,
  validateCanon,
  validateCurricula,
} from './validate-data.mjs'

const canon = JSON.parse(await readFile(new URL('../src/data/scripture-metadata.json', import.meta.url), 'utf8'))
const curricula = JSON.parse(await readFile(new URL('../src/data/curricula.json', import.meta.url), 'utf8'))

test('canon and approved curriculum schedules are complete and valid', () => {
  assert.deepEqual(validateCanon(canon), { works: 5, books: 87 })
  assert.deepEqual(validateCurricula(canon, curricula), [
    { year: 2025, weeks: 52 },
    { year: 2026, weeks: 52 },
  ])
})

test('reading validation accepts shorthand chapter ranges and rejects out-of-range verses', () => {
  const references = parseReadingAssignment(canon, 'Psalms 116–19; 127–28')
  assert.deepEqual(references.map(({ startChapter, endChapter }) => [startChapter, endChapter]), [
    [116, 119],
    [127, 128],
  ])
  assert.throws(
    () => parseReadingAssignment(canon, 'Genesis 1:32'),
    /verse range is outside Genesis 1/,
  )
})

test('reading validation rejects unknown books and invalid chapter ranges', () => {
  assert.throws(() => parseReadingAssignment(canon, 'Unknown Book 1'), /unknown scripture book/)
  assert.throws(() => parseReadingAssignment(canon, 'Genesis 51'), /chapter\/section range is outside/)
})

test('verse bounds cover the Book of Mormon and Doctrine and Covenants', () => {
  assert.doesNotThrow(() => parseReadingAssignment(canon, '1 Nephi 1:20'))
  assert.throws(() => parseReadingAssignment(canon, '1 Nephi 1:21'), /verse range is outside/)
  assert.doesNotThrow(() => parseReadingAssignment(canon, 'Doctrine and Covenants 1:39'))
  assert.throws(() => parseReadingAssignment(canon, 'Doctrine and Covenants 1:40'), /verse range is outside/)
})
