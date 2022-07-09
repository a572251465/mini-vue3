import { isObject } from '@vue/shared'
import { mutableHandlers, readonlyHandlers } from './baseHandlers'

// 依赖收集的过程：WeakMap => Map => effect

export const enum ReactiveFlags {
  // 是否跳过
  SKIP = '__v_skip',
  // 是否reactive过
  IS_REACTIVE = '__v_isReactive',
  // 是否只读
  IS_READONLY = '__v_isReadonly',
  // 是否浅代理
  IS_SHALLOW = '__v_isShallow',
  // 是否原数据
  RAW = '__v_raw'
}

export type Target<T = boolean> = Partial<{
  [ReactiveFlags.SKIP]: boolean
  [ReactiveFlags.IS_REACTIVE]: boolean
  [ReactiveFlags.IS_READONLY]: boolean
  [ReactiveFlags.IS_SHALLOW]: boolean
  [ReactiveFlags.RAW]: boolean
}>

export const reactiveMap = new WeakMap<Target, any>()
export const readonlyMap = new WeakMap<Target, any>()

export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value)
}

export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}

export function isReactive(value: unknown): boolean {
  // 使用方法isReadonly 判断是否只读 && 方法isReactive 是否是响应式
  if (isReadonly(value)) {
    return isReactive((value as Target)[ReactiveFlags.RAW])
  }
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

// 为了创建响应式模块方法
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    return target
  }

  // TODO
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }

  // 进行缓存判断
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 返回代理 进行返回
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}

//readonly入口
export function readonly(target: object) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyHandlers,
    readonlyMap
  )
}

// reactive入口
export function reactive(target: object) {
  // 如果是只读的话  直接返回
  if (isReadonly(target)) return target

  // 创建proxy对象
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableHandlers,
    reactiveMap
  )
}
