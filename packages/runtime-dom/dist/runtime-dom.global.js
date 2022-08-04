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
    Lifecycle: () => Lifecycle,
    ReactiveEffect: () => ReactiveEffect,
    Teleport: () => TeleportImpl,
    Text: () => Text,
    activeEffectScope: () => activeEffectScope,
    computed: () => computed,
    createComponentInstance: () => createComponentInstance,
    createElementBlock: () => createElementBlock,
    createElementVNode: () => createVnode,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    currentInstance: () => currentInstance,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    openBlock: () => openBlock,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    render: () => render,
    renderComponent: () => renderComponent,
    setCurrentInstance: () => setCurrentInstance,
    setupComponent: () => setupComponent,
    toRefs: () => toRefs,
    topDisplayString: () => topDisplayString,
    watch: () => watch
  });

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectScope;
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = this.parent;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  function effectScope(detached = false) {
    return new EffectScope(detached);
  }

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
      recordEffectScope(this);
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
  var isString = (val) => {
    return typeof val === "string";
  };
  var isNumber = (val) => {
    return typeof val === "number";
  };
  var isArray = Array.isArray;
  var invokeArrayFns = (fns) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i]();
    }
  };
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (v, k) => hasOwnProperty.call(v, k);

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
      this.__v_isRef = true;
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

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (let key in rawProps) {
        const val = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = val;
        } else {
          attrs[key] = val;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
    if (instance.vnode.shapeFlag & 2 /* FUNCTIONAL_COMPONENT */) {
      instance.props = instance.attrs;
    }
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
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }

  // packages/runtime-core/src/component.ts
  var currentInstance = null;
  var setCurrentInstance = (instance) => {
    currentInstance = instance;
  };
  var getCurrentInstance = () => {
    return currentInstance;
  };
  function createComponentInstance(vnode, parent) {
    const instance = {
      provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null),
      parent,
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
      setupState: {},
      slots: {}
    };
    return instance;
  }
  var publicPropertyMap = {
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots
  };
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  function setupComponent(instance) {
    let { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, {
      get(target, key) {
        const { data: data2, props: props2, setupState } = target;
        if (data2 && hasOwn(data2, key)) {
          return data2[key];
        } else if (props2 && hasOwn(setupState, key)) {
          return setupState[key];
        } else if (props2 && hasOwn(props2, key)) {
          return props2[key];
        }
        let getter = publicPropertyMap[key];
        if (getter) {
          return getter(target);
        }
      },
      set(target, key, val) {
        const { data: data2, props: props2, setupState } = target;
        if (data2 && hasOwn(data2, key)) {
          data2[key] = val;
          return true;
        } else if (data2 && hasOwn(setupState, key)) {
          setupState[key] = val;
          return true;
        } else if (props2 && hasOwn(props2, key)) {
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
        },
        attrs: instance.attrs,
        slots: instance.slots
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
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
  function renderComponent(instance) {
    let { vnode, render: render2, props } = instance;
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
      return render2.call(instance.proxy, instance.proxy);
    } else {
      return vnode.type(props);
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
        let copyQueue = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copyQueue.length; i++) {
          let job2 = copyQueue[i];
          job2();
        }
        copyQueue.length = 0;
      });
    }
  }

  // packages/runtime-core/src/components/Teleport.ts
  var TeleportImpl = {
    __isTeleport: true,
    process(oldN, newN, container, anchor, internals) {
      let { mountChildren, patchChildren, move } = internals;
      if (!oldN) {
        const target = document.querySelector(newN.props.to);
        if (target) {
          mountChildren(target, newN.children);
        }
      } else {
        patchChildren(oldN, newN, container);
        if (newN.props.to !== oldN.props.to) {
          const nextTarget = document.querySelector(newN.props.to);
          newN.children.forEach((child) => move(child, nextTarget));
        }
      }
    }
  };
  var isTeleport = (type) => {
    return type.__isTeleport;
  };

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(val) {
    return !!(val && val.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null, patchFlag = 0) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isFunction(type) ? 2 /* FUNCTIONAL_COMPONENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props["key"],
      __v_isVnode: true,
      shapeFlag,
      patchFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = shapeFlag | type2;
    }
    if (currnetBlock && vnode.patchFlag > 0) {
      currnetBlock.push(vnode);
    }
    return vnode;
  }
  var currnetBlock = null;
  function openBlock() {
    currnetBlock = [];
  }
  function createElementBlock(type, props, children, patchFlag) {
    return setupBlock(createVnode(type, props, children, patchFlag));
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = currnetBlock;
    currnetBlock = null;
    return vnode;
  }
  function topDisplayString(val) {
    return isString(val) ? val : val == null ? "" : isObject(val) ? JSON.stringify(val) : String(val);
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
      patchProp: hostPatchProp
    } = renderOptions2;
    const normalize = (children, i) => {
      if (isString(children[i]) || isNumber(children[i])) {
        let vnode = createVnode(Text, null, children[i]);
        children[i] = vnode;
      }
      return children[i];
    };
    const mountChildren = (el, children, parentComponent) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, el, parentComponent);
      }
    };
    const mountElement = (vnode, container, anchor, parentComponent) => {
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
        mountChildren(el, children, parentComponent);
      }
      hostInsert(el, container, anchor);
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
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
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
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i]);
            i++;
          }
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
    const patchChildren = (oldN, newN, el, parentComponent) => {
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
          mountChildren(el, c2, parentComponent);
        }
      } else {
        hostSetElementText(el, "");
      }
    };
    const patchBlockChildren = (oldN, newN, parentComponent) => {
      for (let i = 0; i < newN.dynamicChildren.length; i++) {
        patchElement(oldN.dynamicChildren[i], newN.dynamicChildren[i], parentComponent);
      }
    };
    const patchElement = (oldN, newN, parentComponent) => {
      let el = newN.el = oldN.el;
      let oldProps = oldN.props || {};
      let newProps = newN.props || {};
      let { patchFlag } = newN;
      if (patchFlag & 2 /* CLASS */) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, "class", null, newProps.class);
        }
      } else {
        patchProps(oldProps, newProps, el);
      }
      if (newN.dynamicChildren) {
        patchBlockChildren(oldN, newN, parentComponent);
      } else {
        for (let i = 0; i < newN.children.length; i++) {
          newN.children[i] = normalize(newN.children, i);
        }
        patchChildren(oldN, newN, el, parentComponent);
      }
    };
    const processElement = (oldN, newN, container, anchor, parentComponent) => {
      if (oldN === null) {
        mountElement(newN, container, anchor, parentComponent);
      } else {
        patchElement(oldN, newN, parentComponent);
      }
    };
    const processFragment = (oldN, newN, container, parentComponent) => {
      if (oldN == null) {
        mountChildren(container, newN.children, parentComponent);
      } else {
        patchChildren(oldN, newN, container, parentComponent);
      }
    };
    const mountComponent = (vnode, container, anchor, parentComponent) => {
      let instance = vnode.component = createComponentInstance(vnode, parentComponent);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next.props);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const { render: render3, vnode } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          let { bm, m } = instance;
          if (bm) {
            invokeArrayFns(bm);
          }
          const subTree = renderComponent(instance);
          patch(null, subTree, container, anchor, instance);
          if (m) {
            invokeArrayFns(m);
          }
          instance.subTree = subTree;
          instance.isMounted = true;
        } else {
          let { next, bu, u } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          if (bu) {
            invokeArrayFns(bu);
          }
          const subTree = renderComponent(instance);
          patch(instance.subTree, subTree, container, anchor, instance);
          instance.subTree = subTree;
          if (u) {
            invokeArrayFns(u);
          }
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
    const processComponent = (oldN, newN, container, anchor, parentComponent) => {
      if (oldN === null) {
        mountComponent(newN, container, anchor, parentComponent);
      } else {
        updateComponent(oldN, newN);
      }
    };
    const patch = (oldN, newN, container, anchor = null, parentComponent = null) => {
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
          processFragment(oldN, newN, container, parentComponent);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(oldN, newN, container, anchor, parentComponent);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(oldN, newN, container, anchor, parentComponent);
          } else if (shapeFlag & 64 /* TELEPORT */) {
            type.process(oldN, newN, container, anchor, {
              mountChildren,
              patchChildren,
              move(vnode, container2) {
                hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container2);
              }
            });
          }
      }
    };
    const unmount = (vnode) => {
      if (vnode.type === Fragment) {
        return unmountChildren(vnode);
      } else if (vnode.shapeFlag & 6 /* COMPONENT */) {
        return unmount(vnode.component.subTree);
      }
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

  // packages/runtime-core/src/apiLifecycle.ts
  var Lifecycle = /* @__PURE__ */ ((Lifecycle2) => {
    Lifecycle2["BEFORE_MOUNT"] = "bm";
    Lifecycle2["MOUNTED"] = "m";
    Lifecycle2["BEFORE_UPDATE"] = "bu";
    Lifecycle2["UPDATED"] = "u";
    return Lifecycle2;
  })(Lifecycle || {});
  function createHook(type) {
    return (hook, target = currentInstance) => {
      if (target) {
        const hooks = target[type] || (target[type] = []);
        const wrappedHook = () => {
          setCurrentInstance(target);
          hook();
          setCurrentInstance(null);
        };
        hooks.push(wrappedHook);
      }
    };
  }
  var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  var onMounted = createHook("m" /* MOUNTED */);
  var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  var onUpdated = createHook("u" /* UPDATED */);

  // packages/runtime-core/src/apiInject.ts
  function provide(key, val) {
    if (!currentInstance) {
      console.error("provide  \u5FC5\u987B\u5728setup\u8BED\u6CD5\u4E2D");
      return;
    }
    let parentProvides = currentInstance.parent && currentInstance.parent.provides;
    let provides = currentInstance.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(provides);
    }
    provides[key] = val;
  }
  function inject(key, defaulVal) {
    if (!currentInstance) {
      console.error("provide  \u5FC5\u987B\u5728setup\u8BED\u6CD5\u4E2D");
      return;
    }
    const provides = currentInstance.parent && currentInstance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return defaulVal;
    }
  }

  // packages/runtime-core/src/defineAsyncComponent.ts
  var defineAsyncComponent = (options) => {
    if (typeof options === "function") {
      options = { loader: options };
    }
    return {
      setup() {
        const loaded = ref(false);
        const error = ref(false);
        const loading = ref(false);
        const { loader, timeout, errorComponent, delay, LoadingComponent, onError } = options;
        if (delay) {
          setTimeout(() => {
            loading.value = true;
          }, delay);
        }
        let Comp = null;
        function load() {
          return loader().catch((err) => {
            if (onError) {
              return new Promise((resolve, reject) => {
                const retry = () => resolve(load());
                const fail = () => reject(err);
                onError(err, retry, fail);
              });
            }
          });
        }
        load().then((c) => {
          Comp = c;
          loaded.value = true;
        }).catch((err) => error.value = err).finally(() => {
          loading.value = false;
        });
        setTimeout(() => {
          error.value = true;
        }, timeout);
        return () => {
          if (loaded.value) {
            return h(Comp);
          } else if (error.value && errorComponent) {
            return h(errorComponent, []);
          } else if (loading.value && LoadingComponent) {
            return h(LoadingComponent, []);
          }
          return h(Fragment, []);
        };
      }
    };
  };

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
    if (nextValue == null) {
      el.removeattribute("class");
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vel = {});
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
