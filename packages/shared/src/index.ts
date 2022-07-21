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


// export const isArray = (val)=>{
//   return Array.isArray(val)
// }

export const isArray = Array.isArray
export const assign = Object.assign


const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (v,k)=>hasOwnProperty.call(v,k)



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
