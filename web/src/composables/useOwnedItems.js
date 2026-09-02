import { ref, computed, watch } from 'vue'

const storageKey = 'd2hub-owned-items-v2'
const initial = (() => {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') }
  catch { return [] }
})()

const ownedItemIds = ref(Array.isArray(initial) ? initial : [])

watch(ownedItemIds, value => {
  localStorage.setItem(storageKey, JSON.stringify(value))
}, { deep: true })

export function useOwnedItems() {
  const ownedSet = computed(() => new Set(ownedItemIds.value))
  const isOwned = id => ownedSet.value.has(id)
  const toggle = id => {
    ownedItemIds.value = isOwned(id)
      ? ownedItemIds.value.filter(item => item !== id)
      : [...ownedItemIds.value, id]
  }
  const clear = () => { ownedItemIds.value = [] }
  return { ownedItemIds, ownedSet, isOwned, toggle, clear }
}

