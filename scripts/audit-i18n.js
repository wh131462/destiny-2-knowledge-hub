// Read-only inventory, not a translation-completeness gate.
// Run: node scripts/audit-i18n.js > docs/audits/i18n-inventory.json
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import uiEnglish from '../web/src/i18n/ui-en.js'
import editorialEnglish from '../web/src/i18n/editorial-en.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../web/package.json', import.meta.url))
const { parse, babelParse } = require('@vue/compiler-sfc')
const { parse: parseTemplate } = require('@vue/compiler-dom')
const han = /\p{Script=Han}/u
const read = path => readFileSync(resolve(root, path), 'utf8')
const filesUnder = path => readdirSync(resolve(root, path), { withFileTypes: true }).flatMap(entry => {
  const file = `${path}/${entry.name}`
  return entry.isDirectory() ? filesUnder(file) : [file]
})
const routes = read('web/src/router/index.js')
const routedViews = new Set([...routes.matchAll(/import\('@\/views\/([^']+)'\)/g)].map(match => `web/src/views/${match[1]}`))
const files = filesUnder('web/src').filter(file => file.endsWith('.vue')).sort()
const attributes = new Set(['aria-label', 'aria-description', 'title', 'placeholder', 'alt', 'label', 'description', 'ok-text', 'cancel-text'])
const inventory = files.map(file => {
  const source = read(file)
  const { descriptor, errors } = parse(source, { filename: file })
  if (errors.length) throw new Error(`${file}: ${errors.join('; ')}`)
  const candidates = []
  if (descriptor.template) {
    const offset = descriptor.template.loc.start.line - 1
    const record = (kind, node, text) => {
      if (han.test(text)) candidates.push({ kind, line: offset + node.loc.start.line, text: text.trim() })
    }
    const walk = node => {
      if (node.type === 2) record('literal-text', node, node.content)
      if (node.type === 1) {
        for (const prop of node.props) {
          if (prop.type === 6 && attributes.has(prop.name) && prop.value) record(`literal-${prop.name}`, prop, prop.value.content)
        }
      }
      for (const child of node.children || []) walk(child)
    }
    walk(parseTemplate(descriptor.template.content))
  }
  return {
    file,
    routedView: routedViews.has(file),
    importsI18n: /from\s+['"]@\/i18n['"]/.test(source),
    literalCandidates: candidates.length,
    candidates
  }
})

// Compare the actual object keys without executing the app module.
const ast = babelParse(read('web/src/i18n/index.js'), { sourceType: 'module' })
const messages = ast.program.body.flatMap(node => node.declarations || []).find(node => node.id?.name === 'messages')?.init
if (messages?.type !== 'ObjectExpression') throw new Error('Expected a static messages object; update the audit for the new resource format.')
const propertyName = prop => prop.key.name ?? prop.key.value
const leafKeys = (node, prefix = '') => node.properties.flatMap(prop => {
  const key = `${prefix}${propertyName(prop)}`
  return prop.value.type === 'ObjectExpression' ? leafKeys(prop.value, `${key}.`) : [key]
})
const keys = Object.fromEntries(messages.properties.map(prop => [propertyName(prop), leafKeys(prop.value)]))
const literalCalls = filesUnder('web/src').filter(file => /\.(vue|js)$/.test(file)).flatMap(file =>
  [...read(file).matchAll(/\b(?:t|translate)\(\s*['"]([\w.]+)['"]/g)].map(match => ({ file, key: match[1] }))
)
const sourceEnglish = { ...editorialEnglish, ...uiEnglish }
const sourceCalls = filesUnder('web/src').filter(file => /\.(vue|js)$/.test(file) && !file.includes('/i18n/')).flatMap(file =>
  [...read(file).replaceAll('&quot;', '"').matchAll(/\bui\(\s*(['"])(.*?)\1/g)].map(match => ({ file, source: match[2] }))
)
const report = {
  scope: 'Vue SFC template literal text and static display attributes; static message keys and literal t()/translate() calls.',
  limitations: [
    'Candidates require review: language-specific branches, language names, brands and bilingual reference text may be intentional.',
    'Expressions, script strings, runtime content, shared packages, CSS text and HTML metadata are not included in literal candidate counts.',
    'An i18n import does not prove coverage; wrapper components may inherit localization from their children.',
    'Static call matching does not resolve aliases or dynamic keys and is not a complete missing-key analysis.',
    'routedView only means directly imported by the current router; component reachability is not calculated.'
  ],
  summary: {
    vueFiles: inventory.length,
    directlyRoutedViews: routedViews.size,
    vueFilesImportingI18n: inventory.filter(row => row.importsI18n).length,
    filesWithLiteralCandidates: inventory.filter(row => row.literalCandidates).length,
    templateLiteralCandidates: inventory.reduce((sum, row) => sum + row.literalCandidates, 0),
    directlyRoutedViewsWithoutI18nImport: inventory.filter(row => row.routedView && !row.importsI18n).map(row => row.file)
  },
  sourceMessages: {
    uiEnglishKeys: Object.keys(uiEnglish).length,
    editorialEnglishKeys: Object.keys(editorialEnglish).length,
    unresolvedLiteralUiCalls: sourceCalls.filter(call => han.test(call.source) && !Object.hasOwn(sourceEnglish, call.source)),
    note: 'Source-call inventory is supplemental. Dynamic data coverage is checked by tests/i18n.test.js for the listed editorial catalogs; neither proves all runtime text is translated.'
  },
  dictionary: {
    keysPerLocale: Object.fromEntries(Object.entries(keys).map(([locale, values]) => [locale, values.length])),
    missingEnglishKeys: keys.zh.filter(key => !keys.en.includes(key)),
    missingChineseKeys: keys.en.filter(key => !keys.zh.includes(key)),
    unresolvedLiteralCalls: literalCalls.filter(call => Object.values(keys).some(values => !values.includes(call.key)))
  },
  files: inventory
}
console.log(JSON.stringify(report, null, 2))
