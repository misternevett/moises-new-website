import sheets from './caseStudiesSource.json'
import { assetUrl } from '../utils/assetUrl.js'

function normalizeCopy(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function slugify(value) {
  return normalizeCopy(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function splitLines(value) {
  return normalizeCopy(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getMediaType(src) {
  return /\.mp4($|\?)/i.test(src) ? 'video' : 'image'
}

function createMediaBlock(token, mediaMap) {
  const src = mediaMap[token] || null
  return {
    type: 'media',
    token,
    src,
    mediaType: src ? getMediaType(src) : null,
  }
}

function parseBlocks(rawValue, mediaMap) {
  return normalizeCopy(rawValue)
    .split(/\n{2,}/)
    .map((block) => normalizeCopy(block))
    .filter(Boolean)
    .map((block) => {
      const tokenMatch = block.match(/^<([^>]+)>$/)
      if (tokenMatch) {
        return createMediaBlock(tokenMatch[1], mediaMap)
      }

      return {
        type: 'paragraph',
        text: block,
      }
    })
}

function parseBodySections(rawValue, mediaMap) {
  const normalized = normalizeCopy(rawValue)
  const headingMatches = [...normalized.matchAll(/^(\d+\.-\s+.+)$/gm)]

  return headingMatches.map((match, index) => {
    const title = match[1].replace(/^\d+\.-\s+/, '').trim()
    const startIndex = match.index + match[0].length
    const endIndex =
      index < headingMatches.length - 1 ? headingMatches[index + 1].index : normalized.length
    const content = normalized.slice(startIndex, endIndex).trim()

    return {
      id: slugify(title),
      title,
      blocks: parseBlocks(content, mediaMap),
    }
  })
}

function buildMediaMap(folder, tokenMap) {
  return Object.fromEntries(
    Object.entries(tokenMap).map(([token, filename]) => [
      token,
      assetUrl(`/case-studies/${folder}/${filename}`),
    ]),
  )
}

const SOURCE_ROWS = sheets[0]?.rows?.slice(1) || []
const ROW_BY_BRAND = new Map(SOURCE_ROWS.map((row) => [row.A, row]))

const CASE_STUDY_CONFIGS = [
  {
    brand: 'Rabanne',
    id: 'rabanne',
    folder: 'rabanne',
    thumbnail: assetUrl('/case-studies/rabanne/thumbnail.png'),
    heroImage: assetUrl('/case-studies/rabanne/hero.mp4'),
    mediaMap: buildMediaMap('rabanne', {
      R_1: 'hero.mp4',
      R_2: 'R_2.png',
      R_3: 'R_3.png',
      R_4: 'R_4.png',
      R_5: 'R_5.png',
      R_6: 'R_6.png',
      R_7: 'R_7.png',
      R_8: 'R_8.png',
      R_9: 'R_9.png',
      R_10: 'R_10.png',
      R_11: 'R_11.png',
      R_12: 'R_12.png',
      R_13: 'R_13.png',
      R_14: 'R_14.mp4',
      R_15: 'R_15.png',
      R_16: 'R_16.png',
    }),
  },
  {
    brand: 'The Dubai Mall',
    id: 'dubai-mall',
    folder: 'the-dubai-mall',
    thumbnail: assetUrl('/case-studies/the-dubai-mall/thumbnail.png'),
    heroImage: assetUrl('/case-studies/the-dubai-mall/hero.mp4'),
    mediaMap: buildMediaMap('the-dubai-mall', {
      TDM_1: 'hero.mp4',
      TDM_2: 'TDM_2.mp4',
      TDM_3: 'TDM_3.png',
      TDM_4: 'TDM_4.png',
      TDM_5: 'TDM_5.png',
      TDM_6: 'TDM_6.png',
      TDM_7: 'TDM_7.png',
      TDM_8: 'TDM_8.mp4',
      TDM_9: 'TDM_9.png',
      TDM_10: 'TDM_10.mp4',
      TDM_11: 'TDM_11.png',
      TDM_12: 'TDM_12.png',
      TDM_13: 'TDM_13.png',
      TDM_14: 'TDM_14.png',
    }),
  },
  {
    brand: 'The Fourth',
    id: 'the-fourth',
    folder: 'the-fourth',
    thumbnail: assetUrl('/case-studies/the-fourth/F_Thumbnail.png'),
    heroImage: assetUrl('/case-studies/the-fourth/hero.png'),
    mediaMap: buildMediaMap('the-fourth', {
      F_1: 'hero.png',
      F_2: 'F_2.png',
      F_3: 'F_3.png',
      F_4: 'F_4.png',
      F_5: 'F_5.png',
      F_6: 'F_6.png',
      F_7: 'F_7.png',
      F_8: 'F_8.png',
    }),
  },
]

export const caseStudySheetNames = sheets.map((sheet) => sheet.name)
export const caseStudyNamesFound = SOURCE_ROWS.map((row) => row.A)
export const caseStudyFolders = CASE_STUDY_CONFIGS.map((config) => config.folder)

export const caseStudies = CASE_STUDY_CONFIGS.map((config) => {
  const row = ROW_BY_BRAND.get(config.brand)
  const body = parseBodySections(row?.L || '', config.mediaMap)
  const reflections = parseBlocks(row?.M || '', config.mediaMap)
  const processAnchors = body.map((section) => ({
    id: section.id,
    label: section.title,
  }))

  return {
    id: config.id,
    slug: config.id,
    brand: config.brand,
    signpostIntro: normalizeCopy(row?.B),
    tagline: normalizeCopy(row?.C),
    thumbnail: config.thumbnail,
    heroImage: config.heroImage,
    heroMediaType: getMediaType(config.heroImage),
    heroToken: normalizeCopy(row?.D).replace(/[<>]/g, ''),
    meta: {
      background: normalizeCopy(row?.E),
      problem: normalizeCopy(row?.F),
      projectGoals: normalizeCopy(row?.G),
      role: normalizeCopy(row?.H),
      timeline: normalizeCopy(row?.I),
      tools: splitLines(row?.J),
    },
    processAnchors,
    body,
    reflections,
    mediaMap: config.mediaMap,
  }
})
