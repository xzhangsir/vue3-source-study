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
    computed: () => computed,
    effect: () => effect,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = null;
      this.deps = [];
      this.active = true;
    }
    run() {
      if (!this.active) {
        this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
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
  function trigger(target, type, key, value, oldVal) {
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

  // packages/shared/src/index.ts
  var isObject = (val) => {
    return typeof val === "object" && val !== null;
  };
  var isFunction = (val) => {
    return typeof val === "function";
  };
  var isArray = Array.isArray;

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, "get", key);
      let res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      let oldVal = Reflect.get(target, key, receiver);
      let res = Reflect.set(target, key, value, receiver);
      if (oldVal !== value) {
        trigger(target, "set", key, value, oldVal);
      }
      return res;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(val) {
    return !!(val && val["__v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!isObject(target))
      return;
    if (reactiveMap.has(target)) {
      return reactiveMap.get(target);
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._disty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._disty) {
          this._disty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      this.dep.add(activeEffect);
      if (this._disty) {
        this._disty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newVal) {
      this.setter(newVal);
    }
  };
  function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions);
    let getter, setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("no set");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  }

  // packages/reactivity/src/watch.ts
  function traversal(val, set = /* @__PURE__ */ new Set()) {
    if (!isObject(val))
      return val;
    if (set.has(val)) {
      return val;
    }
    set.add(val);
    for (let key in val) {
      traversal(val[key], set);
    }
    return val;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    let oldVal;
    const job = () => {
      if (cleanup)
        cleanup();
      const newVal = effect2.run();
      cb(newVal, oldVal, onCleanup);
      oldVal = newVal;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldVal = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(val) {
    return isObject(val) ? reactive(val) : val;
  }
  var RefImpl = class {
    constructor(rawVal) {
      this.rawVal = rawVal;
      this.dep = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(rawVal);
    }
    get value() {
      this.dep.add(activeEffect);
      return this._value;
    }
    set value(newVal) {
      if (newVal !== this.rawVal) {
        this._value = toReactive(newVal);
        this.rawVal = newVal;
        triggerEffects(this.dep);
      }
    }
  };
  function ref(val) {
    return new RefImpl(val);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newVal) {
      this.object[this.key] = newVal;
    }
  };
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, recevier) {
        let r = Reflect.get(target, key, recevier);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, value, recevier) {
        let oldVal = Reflect.get(target, key, recevier);
        if (oldVal.__v_isRef) {
          oldVal.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, recevier);
        }
      }
    });
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
