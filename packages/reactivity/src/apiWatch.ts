import { hasChanged } from '@vue/shared'
import { isRef } from './ref'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

function doWatch(source: any, cb: any, options: any) {
  let { immediate, deep } = options
  let getter: () => any

  // 判断是否是ref/ reactive/ function
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (typeof source === 'function') {
    getter = () => source()
  }

  let oldValue: any = undefined
  const job = () => {
    if (!effect.active) return

    if (cb) {
      const newValue = effect.run()
      if (hasChanged(oldValue, newValue)) {
        cb(oldValue, newValue)
      }
    } else [effect.run()]
  }

  const effect = new ReactiveEffect(getter, job)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  }
}

export function watch(source: any, cb: any, options: any = {}) {
  return doWatch(source, cb, options)
}
