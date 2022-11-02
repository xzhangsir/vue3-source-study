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
    effect: () => effect,
    isReactive: () => isReactive,
    isReadonly: () => isReadonly,
    reactive: () => reactive,
    readonly: () => readonly,
    shallowReactive: () => shallowReactive,
    shallowReadonly: () => shallowReadonly,
    stop: () => stop
  });

  // packages/shared/src/index.ts
  var isObject = (val) => {
    return typeof val === "object" && val !== null;
  };
  var isArray = Array.isArray;
  var extend = Object.assign;

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  var shouldTrack;
  var ReactiveEffect = class {
    constructor(fn, schefuler) {
      this.fn = fn;
      this.schefuler = schefuler;
      this.parent = null;
      this.deps = [];
      this.active = true;
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        shouldTrack = true;
        let result = this.fn();
        shouldTrack = false;
        return result;
      } finally {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
      if (this.onStop)
        this.onStop();
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, key) {
    if (!isTracking())
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
  function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  function stop(runner) {
    runner.effect.stop();
  }
  function isTracking() {
    return shouldTrack && activeEffect !== void 0;
  }

  // packages/reactivity/src/basehandlers.ts
  var get = createGetter();
  var set = createSetter();
  var readonlyGet = createGetter(true);
  var shallowReactiveGet = createGetter(false, true);
  var shallowReadonlyGet = createGetter(true, true);
  function createGetter(isReadonly2 = false, shallow = false) {
    return function get2(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      if (key === "__v_isReadonly" /* IS_READONLY */) {
        return isReadonly2;
      }
      if (!isReadonly2) {
        track(target, key);
      }
      const res = Reflect.get(target, key, receiver);
      if (shallow)
        return res;
      if (isObject(res)) {
        return isReadonly2 ? readonly(res) : reactive(res);
      }
      return res;
    };
  }
  function createSetter() {
    return function set2(target, key, value, receiver) {
      let oldVal = Reflect.get(target, key, receiver);
      let res = Reflect.set(target, key, value, receiver);
      if (oldVal !== value) {
        trigger(target, key);
      }
      return res;
    };
  }
  var mutableHandlers = {
    get,
    set
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      console.warn(`key: ${key} set failed, because ${target} is readonly`);
      return true;
    }
  };
  var shallowReactiveHandlers = extend({}, mutableHandlers, {
    get: shallowReactiveGet
  });
  var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
  });

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (!isObject(target))
      return;
    if (reactiveMap.has(target)) {
      return reactiveMap.get(target);
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }
  function readonly(target) {
    const proxy = new Proxy(target, readonlyHandlers);
    return proxy;
  }
  function isReactive(target) {
    return !!target["__v_isReactive" /* IS_REACTIVE */];
  }
  function isReadonly(target) {
    return !!target["__v_isReadonly" /* IS_READONLY */];
  }
  function shallowReactive(target) {
    if (!isObject(target))
      return;
    if (reactiveMap.has(target)) {
      return reactiveMap.get(target);
    }
    const proxy = new Proxy(target, shallowReactiveHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }
  function shallowReadonly(target) {
    const proxy = new Proxy(target, shallowReadonlyHandlers);
    return proxy;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
