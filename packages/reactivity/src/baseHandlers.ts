import { isReadonly, reactive, ReactiveFlags } from './reactive'
import { isRef } from './ref'
import { hasOwn, isIntegerKey, isObject } from '@vue/shared'

function createGetter(isReadonly = false, shallow = false) {
  return function (target: any, key: any, receiver: any): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    }

    // 此处判断对数据的代理

    const res = Reflect.get(target, key, receiver)

    if (!isReadonly) {
      // 依赖收集
    }

    // 如果浅代理 直接返回
    if (shallow) {
      return res
    }

    if (isRef(res)) {
      return res.value
    }

    if (isObject(res)) {
      return reactive(res)
    }

    return res
  }
}

function createSetter() {
  return function (target: object, key: any, value: any, receiver: any) {
    const oldValue = (target as any)[key]
    // 旧值是只读属性 旧值是ref属性 但是新值不是ref属性
    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
      return false
    }

    // 不是数组 旧值是ref 但是新值不是ref  直接将新值 赋值给ref.value
    if (!Array.isArray(target) && isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    }

    const hadKey =
      Array.isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    // 触发依赖收集
    return result
  }
}

// 表示最基本的getter
/**
 * 源码中还有方法
 * const shallowGet =  createGetter(false, true)
 * const readonlyGet =  createGetter(true)
 * const shallowReadonlyGet =  createGetter(true, true)
 *
 */
const get = createGetter()
const set = createSetter()

const readonlyGet = createGetter(false)
const readonlySet = function (target: any, key: any) {
  console.warn(
    `Set operation on key "${String(key)}" failed: target is readonly.`,
    target
  )
  return true
}

// normal 类型的reactive
export const mutableHandlers = {
  get,
  set
}

//
export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet
}
