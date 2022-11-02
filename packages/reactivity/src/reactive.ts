import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags, readonlyHandlers, shallowReactiveHandlers, shallowReadonlyHandlers } from "./basehandlers";
// 缓存所有被代理的对象
// 防止用户多次代理同一个对象
const reactiveMap = new WeakMap()

export function reactive(target:any){
  // 首先必须是一个对象
  if(!isObject(target))return
  //如果缓存中有这个代理对象 就不再进行代理
  if(reactiveMap.has(target)){
    return reactiveMap.get(target)
  }

  // 对target进行代理
  const proxy = new Proxy(target,mutableHandlers)

  reactiveMap.set(target,proxy)
  return proxy

}

export function readonly(target){
  const proxy  = new Proxy(target,readonlyHandlers)
  return proxy
}

export function isReactive(target) {
  // 访问obj的xxxx属性会触发 get 方法
  // 当 obj 不是一个响应式的时候 由于没有 __v_isReactive属性 所以会是一个undefined 这时候用 !! 把它变成一个布尔类型
  return !!target[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(target) {
  // 同上
  return !!target[ReactiveFlags.IS_READONLY]
}

export function shallowReactive(target){
 // 首先必须是一个对象
  if(!isObject(target))return
  //如果缓存中有这个代理对象 就不再进行代理
  if(reactiveMap.has(target)){
    return reactiveMap.get(target)
  }

  // 对target进行代理
  const proxy = new Proxy(target,shallowReactiveHandlers)

  reactiveMap.set(target,proxy)
  return proxy
}

export function shallowReadonly(target){
  const proxy  = new Proxy(target,shallowReadonlyHandlers)
  return proxy
}