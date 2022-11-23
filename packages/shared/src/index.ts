export  const isObject = (val:any)=>{
  return typeof val === 'object' && val !== null
}

export const isFunction = (val)=>{
  return typeof val === 'function'
}
export const isString = (val)=>{
  return typeof val === 'string'
}
export const isNumber = (val)=>{
  return typeof val === 'number'
}
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
export const isArray = Array.isArray
export const extend = Object.assign

export const enum ShapeFlags { // 形状标识
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}

// 位运算 & | 适合权限的组合 
// let user = 增加（01） | 删除 （10） ； 11
// user（11） & 增加（01）  得 01  故而判断用户有增加的权限


export  const invokeArrayFns = (fns)=>{
  for(let i = 0 ; i < fns.length ;i++){
    fns[i]()
  }
}


export const enum PatchFlags {
  TEXT = 1,   // 动态文本节点
  CLASS = 1 << 1, // 动态class
  STYLE = 1 << 2,// 动态style
  PROPS = 1 << 3,// 除了class\style动态属性
  FULL_PROPS = 1 << 4,//有key 需要完整的diff
  HYDRATE_EVENTS = 1 << 5,// 挂载过事件的
  STABLE_FRAGMENT = 1 << 6,// 稳定序列 子节点顺序不会发送变化
  KEYED_FRAGMENT = 1 << 7,// 子节点有key的fragment
  UNKEYED_FRAGMENT = 1 << 8,// 子节点没有key的fragment
  NEED_PATCH = 1 << 9,// 进行非props比较 ref比较
  DYNAMIC_SLOTS = 1 << 10,// 动态插槽
  DEV_ROOT_FRAGMENT = 1 << 11,
  HOISTED = -1,// 表示静态节点 内容变化 不比较儿子
  BAIL = -2// 表示diff算法应该结束
}
