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
    ReactiveFlags: () => ReactiveFlags,
    isProxy: () => isProxy,
    isReactive: () => isReactive,
    isReadonly: () => isReadonly,
    reactive: () => reactive,
    reactiveMap: () => reactiveMap,
    readonly: () => readonly
  });

  // packages/shared/src/index.ts
  var isObject = (val) => val !== null && typeof val === "object";
  var isString = (val) => typeof val === "string";
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var hasChanged = (value, oldValue) => !Object.is(value, oldValue);

  // packages/reactivity/src/ref.ts
  function isRef(r) {
    return !!(r && r.__v_isRef === true);
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

  // packages/reactivity/src/dep.ts
  var createDep = (effects = []) => {
    const dep = new Set(effects);
    return dep;
  };

  // packages/reactivity/src/reactive.ts
  var weakTarget = /* @__PURE__ */ new WeakMap();
  var activeEffect = null;
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
  var track = (target, type, key) => {
    if (!activeEffect)
      return;
    let depsMap = weakTarget.get(target);
    if (!depsMap) {
      weakTarget.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep.set(key, dep = createDep());
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
    for (const effect of effects) {
      triggerEffect(effect);
    }
  };
  var triggerEffect = (effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
