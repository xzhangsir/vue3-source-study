import { isObject } from "@vue/shared"
import { reactive } from "./reactive"
import { track,trigger} from "./effect"

// TS 独有  枚举
export  const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}
export const mutableHandlers = {
  get(target,key,receiver){
    if(key === ReactiveFlags.IS_REACTIVE){
      return true
    }
    // 依赖收集  effect和key关联
    // 一个effect可能依赖多个对象的多个key
    // 一个对象的某个key也可能被多个effect关联
    track(target,"get",key)
    
    // return Reflect.get(target,key,receiver)

    // 实现深度代理
    let res = Reflect.get(target,key,receiver)
    // 在取值的时候 再进行代理
    // vue2中是直接递归进行代理  所以性能差一点
    if(isObject(res)){
      return reactive(res)
    }
    return res
    
  },
  set(target,key,value,receiver){
    // 先判断新值和老值 是否一致 不一致再触发更新
    let oldVal = Reflect.get(target,key,receiver)
    let res = Reflect.set(target,key,value,receiver)
    if(oldVal !== value){
      //触发更新
      trigger(target,"set",key,value,oldVal)
    }
    return res
  }
}

// 对象 某个属性 -》多个effect
// 数据结构设计
/**
WeakMap = {
  对象：new Map({
    key(name/age):Set
  })
}
*/