import { computed, ref, shallowRef } from 'vue'
import { dataUrl } from '@/utils/dataUrl'

const snapshot = shallowRef(null), byHash = shallowRef(new Map()), state = ref('idle'), error = ref('')
let promise = null
export function useWeaponPerks() {
  async function load() {
    if (snapshot.value) return
    if (!promise) {
      state.value = 'loading'; error.value = ''
      promise = (async () => {
        const response = await fetch(dataUrl('manifest-plugs.json'))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!data.manifestVersion || !Array.isArray(data.items) || data.count !== data.items.length) throw new Error('词条目录格式或数量不一致')
        const map = new Map(data.items.map(p => [p.hash, p]))
        if (map.size !== data.count) throw new Error('词条目录存在重复 Hash')
        byHash.value = map; snapshot.value = data; state.value = 'ready'
      })().catch(e => { state.value = 'error'; error.value = e.message }).finally(() => { promise = null })
    }
    await promise
  }
  return { byHash: computed(() => byHash.value), version: computed(() => snapshot.value?.manifestVersion), state: computed(() => state.value), error: computed(() => error.value), load }
}
