import { isFunction } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

export class ComputedRefImpl {
  // 用来记录收集的effect
  public dep: any
  // 表示内部需要使用的值
  public _value: any
  public readonly effect: any
  public readonly __v_isRef = true
  public _dirty = true

  constructor(getter: any, private readonly _setter: any) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        // TODO 触发依赖
        triggerRefValue(this)
      }
    })

    this.effect.computed = this
    this.effect.active = true
  }

  get value() {
    // TODO 收集依赖
    trackRefValue(this)

    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }

    return this._value
  }

  set value(value: any) {
    this._setter(value)
  }
}

/**
 * @author lihh
 * @description compute 计算属性的实现
 * @param getterOrOptions 传递的参数
 * @param debugOptions
 * @param isSSR 是否ssr
 */
export function computed(
  getterOrOptions: any,
  debugOptions: any,
  isSSR = false
) {
  let getter, setter

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('Write operation failed: computed value is readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter)
  return cRef
}
