import uiEnglish from './ui-en.js'
import editorialEnglish from './editorial-en.js'
const english = { ...editorialEnglish, ...uiEnglish }

export function translateUi(source, locale = 'zh', parameters) {
  const message = locale === 'en' && Object.hasOwn(english, source) ? english[source] : source
  if (!parameters || typeof message !== 'string') return message
  // A callback preserves literal $ characters and braces in user-provided values.
  return message.replace(/\{(\d+)\}/g, (match, index) => parameters[index] ?? match)
}

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const generatedMessages = Object.keys(english).filter(key => /\{\d+\}/.test(key)).sort((a, b) => b.length - a.length).map(key => ({
  key,
  indices: [...key.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1])),
  pattern: new RegExp(`^${key.split(/\{\d+\}/).map(escapeRegex).join('([\\s\\S]*?)')}$`)
}))

// Adapter for existing site-generated status/error strings. Never apply to user
// notes or titles. Captured values remain verbatim, including saved draft names.
export function translateGeneratedMessage(source, locale = 'zh') {
  if (locale !== 'en' || typeof source !== 'string') return source
  if (Object.hasOwn(english, source)) return english[source]
  for (const { key, indices, pattern } of generatedMessages) {
    const match = source.match(pattern)
    if (match) {
      const parameters = []
      indices.forEach((index, i) => { parameters[index] = match[i + 1] })
      return translateUi(key, locale, parameters)
    }
  }
  return source
}
