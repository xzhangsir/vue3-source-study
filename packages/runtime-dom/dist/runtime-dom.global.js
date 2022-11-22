var VueRuntimeDOM = (() => {
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

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    Text: () => Text,
    computed: () => computed,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    effect: () => effect,
    h: () => h,
    isReactive: () => isReactive,
    isReadonly: () => isReadonly,
    isRef: () => isRef,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    readonly: () => readonly,
    ref: () => ref,
    render: () => render,
    shallowReactive: () => shallowReactive,
    shallowReadonly: () => shallowReadonly,
    stop: () => stop,
    toRef: () => toRef,
    toRefs: () => toRefs,
    unRef: () => unRef,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (val) => {
    return typeof val === "object" && val !== null;
  };
  var isFunction = (val) => {
    return typeof val === "function";
  };
  var isString = (val) => {
    return typeof val === "string";
  };
  var isNumber = (val) => {
    return typeof val === "number";
  };
  var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
  var isArray = Array.isArray;
  var extend = Object.assign;

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  var shouldTrack;
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

  // packages/reactivity/src/ref.ts
  var RefImpl = class {
    constructor(val) {
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this._rawVal = val;
      this._value = toReactive(val);
    }
    get value() {
      if (!this.dep.has(activeEffect)) {
        this.dep.add(activeEffect);
      }
      return this._value;
    }
    set value(newVal) {
      if (!hasChanged(this._rawVal, newVal))
        return;
      this._rawVal = newVal;
      this._value = toReactive(newVal);
      triggerEffects(this.dep);
    }
  };
  function ref(val) {
    return new RefImpl(val);
  }
  function isRef(ref2) {
    return !!ref2.__v_isRef;
  }
  function unRef(ref2) {
    return isRef(ref2) ? ref2.value : ref2;
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
  function toRef(reactive2, key) {
    return new ObjectRefImpl(reactive2, key);
  }
  function toRefs(obj) {
    const ret = isArray(obj) ? new Array(obj.length) : {};
    for (const key in obj) {
      ret[key] = toRef(obj, key);
    }
    return ret;
  }
  function proxyRefs(obj) {
    return new Proxy(obj, {
      get(target, key) {
        return unRef(Reflect.get(target, key));
      },
      set(target, key, newVal) {
        if (isRef(target[key]) && !isRef(newVal)) {
          return target[key].value = newVal;
        } else {
          return Reflect.set(target, key, newVal);
        }
      }
    });
  }
  function toReactive(val) {
    return isObject(val) ? reactive(val) : val;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this._getter = getter;
      this._effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      this.dep.add(activeEffect);
      if (this._dirty) {
        this._dirty = false;
        this._value = this._effect.run();
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
  function watch(source, cb, options) {
    return doWatch(source, cb, options);
  }
  function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger }) {
    let getter;
    if (isRef(source)) {
      getter = source.value;
    } else if (isReactive(source)) {
      getter = () => source;
      deep = true;
    } else if (isArray(source)) {
      getter = () => source.map((s) => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(s)) {
          return traverse(s);
        } else if (isFunction(s)) {
          return s();
        }
      });
    } else if (isFunction(source)) {
      getter = () => source();
    }
    if (cb && deep) {
      const baseGetter = getter;
      getter = () => traverse(baseGetter());
    }
    let oldValue;
    const job = () => {
      let newValue = effect2.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    };
    const scheduler = () => job();
    const effect2 = new ReactiveEffect(getter, scheduler);
    if (immediate) {
      job();
    } else {
      oldValue = effect2.run();
    }
  }
  function traverse(value, seen) {
    if (!isObject(value)) {
      return value;
    }
    seen = seen || /* @__PURE__ */ new Set();
    if (seen.has(value)) {
      return value;
    }
    seen.add(value);
    if (isRef(value)) {
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], seen);
      }
    } else if (isObject(value)) {
      for (const key in value) {
        traverse(value[key], seen);
      }
    }
    return value;
  }

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (let key in rawProps) {
        const val = rawProps[key];
        if (Object.hasOwn(options, key)) {
          props[key] = val;
        } else {
          attrs[key] = val;
        }
      }
    } else {
      for (let key in options) {
        attrs[key] = options[key];
      }
    }
    instance.props = shallowReactive(props);
    instance.attrs = attrs;
  }
  var hasPropsChanged = (prevProps = {}, nextProps = {}) => {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  function updateProps(prevProps, nextProps) {
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    for (const key in prevProps) {
      if (!Object.hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }

  // packages/runtime-core/src/component.ts
  function createComponentInstance(vnode) {
    const instance = {
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props,
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      setupState: {}
    };
    return instance;
  }
  var publicPropertyMap = {
    $attrs: (i) => i.attrs
  };
  function setupComponent(instance) {
    let { props, type } = instance.vnode;
    initProps(instance, props);
    instance.proxy = new Proxy(instance, {
      get(target, key) {
        const { data: data2, props: props2, setupState } = target;
        if (data2 && Object.hasOwn(data2, key)) {
          return data2[key];
        } else if (props2 && Object.hasOwn(setupState, key)) {
          return setupState[key];
        } else if (props2 && Object.hasOwn(props2, key)) {
          return props2[key];
        }
        let getter = publicPropertyMap[key];
        if (getter) {
          return getter(target);
        }
      },
      set(target, key, val) {
        const { data: data2, props: props2, setupState } = target;
        if (data2 && Object.hasOwn(data2, key)) {
          data2[key] = val;
          return true;
        } else if (data2 && Object.hasOwn(setupState, key)) {
          setupState[key] = val;
          return true;
        } else if (props2 && Object.hasOwn(props2, key)) {
          console.warn("\u7EC4\u4EF6\u5185\u4E0D\u80FD\u4FEE\u6539\u7EC4\u4EF6\u7684props" + key);
          return false;
        }
        return true;
      }
    });
    let data = type.data;
    if (data) {
      if (!isFunction(data)) {
        return console.warn("data\u5FC5\u987B\u662Ffunction");
      }
      instance.data = reactive(data.call(instance.proxy));
    }
    let setup = type.setup;
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
          const handler = instance.vnode.props[eventName];
          handler && handler(...args);
        }
      };
      const setupResult = setup(instance.props, setupContext);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = type.render;
    }
  }

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlushing = false;
  var resolvePromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlushing) {
      isFlushing = true;
      resolvePromise.then(() => {
        isFlushing = false;
        let copy = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copy.length; i++) {
          let job2 = copy[i];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(val) {
    return !!(val && val.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props["key"],
      __v_isVnode: true,
      shapeFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = shapeFlag | type2;
    }
    return vnode;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    let {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp,
      querySelector
    } = renderOptions2;
    const normalize = (children, i) => {
      if (isString(children[i]) || isNumber(children[i])) {
        let vnode = createVnode(Text, null, children[i]);
        children[i] = vnode;
      }
      return children[i];
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const mountChildren = (el, children) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, el);
      }
    };
    const mountElement = (vnode, container, anchor) => {
      let { type, props, children, shapeFlag } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (let key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(el, children);
      }
      hostInsert(el, container, anchor);
    };
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    };
    const patchKeyChildren = (c1, c2, el) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      } else if (i > e2) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 <= e2; i2++) {
        keyToNewIndexMap.set(c2[i2].key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexArr = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex === void 0) {
          unmount(oldChild);
        } else {
          newIndexToOldIndexArr[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      let increment = getSequence(newIndexToOldIndexArr);
      let j = increment.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        let index = i2 + s2;
        let current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexArr[i2] === 0) {
          patch(null, current, el, anchor);
        } else {
          if (i2 !== increment[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    function getSequence(arr) {
      const len = arr.length;
      const p = new Array(len).fill(0);
      const result = [0];
      let start, end, middle;
      let resultLastIndex;
      for (let i2 = 0; i2 < len; i2++) {
        let arrI = arr[i2];
        if (arrI !== 0) {
          resultLastIndex = result[result.length - 1];
          if (arr[resultLastIndex] < arrI) {
            result.push(i2);
            p[i2] = resultLastIndex;
            continue;
          }
          start = 0;
          end = result.length - 1;
          while (start < end) {
            middle = (start + end) / 2 | 0;
            if (arr[result[middle]] < arrI) {
              start = middle + 1;
            } else {
              end = middle;
            }
          }
          if (arr[result[end]] > arrI) {
            result[end] = i2;
            p[i2] = result[end - 1];
          }
        }
      }
      ;
      let i = result.length;
      let last = result[i - 1];
      while (i-- > 0) {
        result[i] = last;
        last = p[last];
      }
      return result;
    }
    const patchChildren = (oldN, newN, el) => {
      const c1 = oldN && oldN.children;
      const c2 = newN && newN.children;
      const prevShapeFlag = oldN.shapeFlag;
      const activeShapeFlag = newN.shapeFlag;
      if (activeShapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else if (activeShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyChildren(c1, c2, el);
        } else if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
          mountChildren(el, c2);
        }
      } else {
        hostSetElementText(el, "");
      }
    };
    const patchElement = (oldN, newN) => {
      let el = newN.el = oldN.el;
      let oldProps = oldN.props || {};
      let newProps = newN.props || {};
      patchProps(oldProps, newProps, el);
      for (let i = 0; i < newN.children.length; i++) {
        newN.children[i] = normalize(newN.children, i);
      }
      patchChildren(oldN, newN, el);
    };
    const processText = (oldN, newN, container) => {
      if (oldN === null) {
        hostInsert(newN.el = hostCreateText(newN.children), container);
      } else {
        const el = newN.el = oldN.el;
        if (newN.children !== oldN.children) {
          hostSetText(el, newN.children);
        }
      }
    };
    const processFragment = (oldN, newN, container) => {
      if (oldN == null) {
        mountChildren(container, newN.children);
      } else {
        patchChildren(oldN, newN, container);
      }
    };
    const processElement = (oldN, newN, container, anchor) => {
      if (oldN === null) {
        mountElement(newN, container, anchor);
      } else {
        patchElement(oldN, newN);
      }
    };
    const mountComponent = (vnode, container, anchor) => {
      let instance = vnode.component = createComponentInstance(vnode);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next.props);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const { render: render3 } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          const subTree = render3.call(instance.proxy);
          patch(null, subTree, container, anchor);
          instance.subTree = subTree;
          instance.isMounted = true;
        } else {
          let { next } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          const subTree = render3.call(instance.proxy);
          patch(instance.subTree, subTree, container, anchor);
          instance.subTree = subTree;
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
      let update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const shouldUpdateComponent = (n1, n2) => {
      const { props: prevProps, children: prevChildren } = n1;
      const { props: nextProps, children: nextChildren } = n2;
      if (prevProps === nextProps)
        return false;
      if (prevChildren || nextChildren) {
        return true;
      }
      return hasPropsChanged(prevProps, nextProps);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const processComponent = (oldN, newN, container, anchor) => {
      if (oldN == null) {
        mountComponent(newN, container, anchor);
      } else {
        updateComponent(oldN, newN);
      }
    };
    const patch = (oldN, newN, container, anchor = null) => {
      if (oldN === newN)
        return null;
      if (oldN && !isSameVnode(oldN, newN)) {
        unmount(oldN);
        oldN = null;
      }
      const { type, shapeFlag } = newN;
      switch (type) {
        case Text:
          processText(oldN, newN, container);
          break;
        case Fragment:
          processFragment(oldN, newN, container);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(oldN, newN, container, anchor);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(oldN, newN, container, anchor);
          }
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsChildren, children) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject(propsChildren) && !isArray(propsChildren)) {
        if (isVnode(propsChildren)) {
          return createVnode(type, null, [propsChildren]);
        }
        return createVnode(type, propsChildren);
      } else {
        return createVnode(type, null, propsChildren);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue) {
      el.className = nextValue;
    } else {
      el.removeattribute("class");
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      } else if (exits) {
        el.removeEventListener(event, exits);
        invokers[eventName] = null;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue = {}) {
    for (let key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (nextValue[key] == null) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
