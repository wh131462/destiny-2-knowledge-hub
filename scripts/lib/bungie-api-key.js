import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

export async function readBungieApiKey({ root = repositoryRoot, env = process.env } = {}) {
  if (env.BUNGIE_API_KEY !== undefined) return String(env.BUNGIE_API_KEY).trim()

  for (const name of ['.env.local', '.env']) {
    const path = join(root, name)
    let config
    try {
      config = parseEnv(await readFile(path, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw new Error(`无法读取本地 Key 配置 ${path}（${error.code || '解析失败'}）`)
    }
    if (config.BUNGIE_API_KEY !== undefined) return config.BUNGIE_API_KEY.trim()
  }
  return ''
}
