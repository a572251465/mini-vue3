var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ComputedRefImpl: () => ComputedRefImpl,
    ReactiveFlags: () => ReactiveFlags,
    computed: () => computed,
    effect: () => effect,
    isProxy: () => isProxy,
    isReactive: () => isReactive,
    isReadonly: () => isReadonly,
    isRef: () => isRef,
    reactive: () => reactive,
    reactiveMap: () => reactiveMap,
    readonly: () => readonly,
    ref: () => ref,
    toReactive: () => toReactive,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (val) => val !== null && typeof val === "object";
  var isString = (val) => typeof val === "string";
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
  var isFunction = (fn) => typeof fn === "function";

  // packages/reactivity/src/dep.ts
  var createDep = (effects = []) => {
    const dep = new Set(effects);
    return dep;
  };

  // packages/reactivity/src/effect.ts
  var activeEffect = null;
  var weakTarget = /* @__PURE__ */ new WeakMap();
  var ReactiveEffect = class {
    constructor(fn, scheduler = null) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.deps = [];
      this.parent = void 0;
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      let parent = activeEffect;
      while (parent) {
        if (parent === this) {
          return;
        }
        parent = parent.parent;
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = void 0;
      }
    }
  };
  function effect(fn, options) {
    if (fn.effect) {
      fn = fn.effect.fn;
    }
    const _effect = new ReactiveEffect(fn);
    if (!options || !options.lazy) {
      _effect.run();
    }
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var track = (target, type, key) => {
    if (!activeEffect)
      return;
    let depsMap = weakTarget.get(target);
    if (!depsMap) {
      weakTarget.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep());
    }
    trackEffects(dep);
  };
  var trackEffects = (dep) => {
    const shouldTrack = dep.has(activeEffect);
    if (!shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  };
  var trigger = (target, type, key) => {
    const depsMap = weakTarget.get(target);
    if (!depsMap)
      return;
    const deps = [];
    deps.push(depsMap.get(key));
    const effects = [];
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep);
      }
    }
    triggerEffects(createDep(effects));
  };
  var triggerEffects = (dep) => {
    const effects = Array.isArray(dep) ? dep : [...dep];
    for (const effect2 of effects) {
      triggerEffect(effect2);
    }
  };
  var triggerEffect = (effect2) => {
    if (effect2.scheduler) {
      effect2.scheduler();
    } else {
      effect2.run();
    }
  };

  // packages/reactivity/src/ref.ts
  function isRef(r) {
    return !!(r && r.__v_isRef === true);
  }
  function trackRefValue(ref2) {
    if (activeEffect) {
      trackEffects(ref2.dep || (ref2.dep = createDep()));
    }
  }
  function triggerRefValue(ref2) {
    if (ref2.dep) {
      triggerEffects(ref2.dep);
    }
  }
  var RefImpl = class {
    constructor(value, __v_isShallow) {
      this.__v_isShallow = __v_isShallow;
      this.dep = void 0;
      this.__v_isRef = true;
      this._rawValue = value;
      this._value = toReactive(value);
    }
    get value() {
      trackRefValue(this);
      return this._value;
    }
    set value(newVal) {
      if (hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal;
        this._value = toReactive(newVal);
        triggerRefValue(this);
      }
    }
  };
  function createRef(rawValue) {
    if (isRef(rawValue))
      return rawValue;
    return new RefImpl(rawValue, false);
  }
  function ref(value) {
    return createRef(value);
  }

  // packages/reactivity/src/baseHandlers.ts
  function createGetter(isReadonly2 = false, shallow = false) {
    return function(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return !isReadonly2;
      } else if (key === "__v_isReadonly" /* IS_READONLY */) {
        return isReadonly2;
      } else if (key === "__v_isShallow" /* IS_SHALLOW */) {
        return shallow;
      }
      const res = Reflect.get(target, key, receiver);
      if (!isReadonly2) {
        track(target, "GET", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        return res.value;
      }
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    };
  }
  function createSetter() {
    return function(target, key, value, receiver) {
      const oldValue = target[key];
      if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
        return false;
      }
      if (!Array.isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
      const hadKey = Array.isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (!hadKey) {
        trigger(target, "ADD", key);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "SET", key);
      }
      return result;
    };
  }
  var get = createGetter();
  var set = createSetter();
  var readonlyGet = createGetter(false);
  var readonlySet = function(target, key) {
    console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
    return true;
  };
  var mutableHandlers = {
    get,
    set
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
  };

  // packages/reactivity/src/reactive.ts
  var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
    ReactiveFlags2["SKIP"] = "__v_skip";
    ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags2["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags2["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags2["RAW"] = "__v_raw";
    return ReactiveFlags2;
  })(ReactiveFlags || {});
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  function isProxy(value) {
    return isReactive(value) || isReadonly(value);
  }
  function isReadonly(value) {
    return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
  }
  function isReactive(value) {
    if (isReadonly(value)) {
      return isReactive(value["__v_raw" /* RAW */]);
    }
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  var toReactive = (value) => isObject(value) ? reactive(value) : value;
  function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      return target;
    }
    if (target["__v_raw" /* RAW */] && !(isReadonly2 && target["__v_isReactive" /* IS_REACTIVE */])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyHandlers, readonlyMap);
  }
  function reactive(target) {
    if (isReadonly(target))
      return target;
    return createReactiveObject(target, false, mutableHandlers, mutableHandlers, reactiveMap);
  }

  // packages/reactivity/src/apiWatch.ts
  function doWatch(source, cb, options) {
    let { immediate, deep } = options;
    let getter;
    if (isRef(source)) {
      getter = () => source.value;
    } else if (isReactive(source)) {
      getter = () => source;
      deep = true;
    } else if (typeof source === "function") {
      getter = () => source();
    }
    let oldValue = void 0;
    const job = () => {
      if (!effect2.active)
        return;
      if (cb) {
        const newValue = effect2.run();
        if (hasChanged(oldValue, newValue)) {
          cb(oldValue, newValue);
        }
      } else
        [effect2.run()];
    };
    const effect2 = new ReactiveEffect(getter, job);
    if (cb) {
      if (immediate) {
        job();
      } else {
        oldValue = effect2.run();
      }
    }
  }
  function watch(source, cb, options = {}) {
    return doWatch(source, cb, options);
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, _setter) {
      this._setter = _setter;
      this.__v_isRef = true;
      this._dirty = true;
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerRefValue(this);
        }
      });
      this.effect.computed = this;
      this.effect.active = true;
    }
    get value() {
      trackRefValue(this);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(value) {
      this._setter(value);
    }
  };
  function computed(getterOrOptions, debugOptions, isSSR = false) {
    let getter, setter;
    const onlyGetter = isFunction(getterOrOptions);
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("Write operation failed: computed value is readonly");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    const cRef = new ComputedRefImpl(getter, setter);
    return cRef;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
