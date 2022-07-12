import { activeEffect, trackEffects, triggerEffects } from './effect'
import { createDep } from './dep'

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
