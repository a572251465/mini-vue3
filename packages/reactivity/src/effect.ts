import { createDep } from './dep'

export type EffectScheduler = (...args: any[]) => any
// 表示当前的effect
export let activeEffect: any = null
// 收集依赖的结果集
const weakTarget = new WeakMap()

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
  scope?: any
  allowRecurse?: boolean
  onStop?: () => void
}

// *** 核心 ***
export class ReactiveEffect {
  active = true
  deps: any[] = []
  parent: ReactiveEffect | undefined = undefined
  computed?: any
  allowRecurse?: boolean
  private deferStop?: boolean
  onStop?: () => void

  constructor(
    public fn: () => any,
    public scheduler: EffectScheduler | null = null
  ) {}

  run() {
    if (!this.active) {
      return this.fn()
    }

    // 先备份下之前的activeEffect
    let parent: ReactiveEffect | undefined = activeEffect
    while (parent) {
      if (parent === this) {
        return
      }
      parent = parent.parent
    }

    try {
      // 之前的执行的activeEffect 给父亲
      this.parent = activeEffect
      // 当前类就是 当前的activeEffect
      activeEffect = this

      return this.fn()
    } finally {
      // 执行结束后 还给父类
      activeEffect = this.parent
      // 父类重置为空
      this.parent = undefined
    }
  }
}

// effect 简单实现
export function effect(fn: () => any, options: ReactiveEffectOptions) {
  if ((fn as any).effect) {
    fn = (fn as any).effect.fn
  }

  // 类<ReactiveEffect> 是整个effect核心
  const _effect: any = new ReactiveEffect(fn)
  if (!options || !options.lazy) {
    _effect.run()
  }

  const runner = _effect.run.bind(_effect) as any
  runner.effect = _effect
  return runner
}

// 收集依赖的方法
export const track = (target: Object, type: string, key: string) => {
  if (!activeEffect) return

  let depsMap = weakTarget.get(target)
  if (!depsMap) {
    weakTarget.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}

// 真正用来收集effect
export const trackEffects = (dep: any) => {
  const shouldTrack = dep.has(activeEffect)

  if (!shouldTrack) {
    // 添加effect依赖
    dep.add(activeEffect!)
    activeEffect!.deps.push(dep)
  }
}

// 此方法用来触发依赖
export const trigger = (target: any, type: any, key: any) => {
  const depsMap = weakTarget.get(target)
  if (!depsMap) return

  const deps = []
  deps.push(depsMap.get(key))

  const effects = []
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep)
    }
  }

  triggerEffects(createDep(effects))
}

// 触发依赖
export const triggerEffects = (dep: any) => {
  const effects = Array.isArray(dep) ? dep : [...dep]

  for (const effect of effects) {
    triggerEffect(effect)
  }
}

// 执行依赖的位置
export const triggerEffect = (effect: any) => {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    // 执行effect的run函数
    effect.run()
  }
}
