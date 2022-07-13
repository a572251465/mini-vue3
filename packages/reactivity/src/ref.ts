import { activeEffect, trackEffects, triggerEffects } from './effect'
import { createDep } from './dep'
import { toReactive } from './reactive'
import { hasChanged } from '@vue/shared'

export function isRef(r: any) {
  return !!(r && r.__v_isRef === true)
}

export function trackRefValue(ref: any) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue(ref: any) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

class RefImpl {
  private _value: unknown
  private _rawValue: unknown
  public dep: unknown = undefined
  public readonly __v_isRef = true

  constructor(value: unknown, public readonly __v_isShallow: boolean) {
    this._rawValue = value
    this._value = toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      // 为什么赋值的时候 还需要执行toReactive呢？？ 因为赋值的时候 可能传递的还是对象
      this._value = toReactive(newVal)
      triggerRefValue(this)
    }
  }
}

function createRef(rawValue: unknown) {
  if (isRef(rawValue)) return rawValue

  return new RefImpl(rawValue, false)
}

export function ref(value: unknown) {
  return createRef(value)
}
