import { readonly, shallowRef } from 'vue'

const state = shallowRef({ pending: true, error: false })

export const navigationLoading = readonly(state)
export function updateNavigationLoading(next) {
  state.value = next
}
