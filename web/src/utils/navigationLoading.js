// Match completions to their navigation: an older cancelled route must not
// dismiss the indicator for the route that replaced it.
export function installNavigationLoading(router, update) {
  let activeRoute
  const stopBefore = router.beforeEach(to => {
    activeRoute = to
    update({ pending: true, error: false })
  })
  const finish = (to, error = false) => {
    if (to !== activeRoute) return
    activeRoute = undefined
    update({ pending: false, error })
  }
  const stopAfter = router.afterEach(to => finish(to))
  const stopError = router.onError((_error, to) => finish(to, true))
  return () => {
    stopBefore()
    stopAfter()
    stopError()
  }
}
