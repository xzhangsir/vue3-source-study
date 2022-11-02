import { extend, isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive, readonly } from "./reactive"

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}


const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReactiveGet = createGetter(false, true)
const shallowReadonlyGet = createGetter(true, true)

// 对get包裹一层 isReadonly 默认false
function createGetter(isReadonly = false,shallow = false){
  return function get(target,key,receiver){
    if(key === ReactiveFlags.IS_REACTIVE){
      return true
    }
    if(key === ReactiveFlags.IS_READONLY){
      return isReadonly
    }

    if(!isReadonly){
      // 不是只读的 才可以收集依赖
      track(target,key)
    }
    
    const res = Reflect.get(target,key,receiver)
    //如果不需要深度响应式 那么直接返回 res
    if(shallow) return res;
     // 如果 res 是对象 那么还需要深层次的实现响应式 
    if(isObject(res)){
      return isReadonly ? readonly(res) : reactive(res)
    }
   
    return res
  }
}
// 对 set包裹一层
function createSetter(){
  return  function set(target,key,value,receiver){
      // 先判断新值和老值 是否一致 不一致再触发更新
    let oldVal = Reflect.get(target,key,receiver)
    let res = Reflect.set(target,key,value,receiver)
    if(oldVal !== value){
      //触发更新
      trigger(target,key)
    }
    return res
  }
}

// 当调用 reactive 的时候传入这个 handlers
export const mutableHandlers = {
  get,
  set,
}
// 当调用 readonly 的时候传入这个 handlers
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`key: ${key} set failed, because ${target} is readonly`)
    return true
  }
}


// reactive 的 set 还是不变，只是修改 getter  extend 等同于 Object.assign
export const shallowReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowReactiveGet
})
// readonly 的 set 还是不变，只是修改 getter 
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
