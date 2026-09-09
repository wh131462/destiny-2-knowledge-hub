import { computed, shallowRef, ref } from 'vue'
import { dataUrl } from '@/utils/dataUrl'

const catalog = shallowRef(null)
const status = ref('idle')
let pending
export function useArmorCatalog() {
  async function load() {
    if (catalog.value) return
    if (!pending) {
      status.value = 'loading'
      pending = (async () => {
        const response = await fetch(dataUrl('manifest-armor.json'))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!data.manifestVersion || ['items', 'sets', 'stats', 'mods', 'traits', 'archetypes'].some(key => !Array.isArray(data[key]))) throw new Error('Invalid armor catalog')
        catalog.value = data
        status.value = 'ready'
      })().catch(() => { status.value = 'error' }).finally(() => { pending = null })
    }
    await pending
  }
  return { catalog: computed(() => catalog.value), status: computed(() => status.value), load }
}
