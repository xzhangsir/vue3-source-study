import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import {isReactive} from "./reactive"


function traversal(val, set = new Set()){  //set是为了考虑，如果对象中有循环引用的问题
  // 判断是不是对象 如果不是对象就不在进行递归
  if(!isObject(val)) return val
  if(set.has(val)){
    return val
  }
  set.add(val)
  for(let key in val){
    traversal(val[key],set)
  }
  return val
}

// source是用户传入的对象
// cb就是对应的用户的回调
export function watch(source,cb){
   let getter;
  // 先判断是不是响应式数据
  if(isReactive(source)){
    // 对source 进行递归循环访问对象上的每一个属性
    // 访问属性的时候 会收集effect
    getter = ()=>traversal(source)
  }else  if(isFunction(source)){
    // 判断传的是不是个函数
    getter = source
  }else{
    return  
  }
  let cleanup;
  const onCleanup = (fn)=>{
    cleanup  = fn
  }
  
  let oldVal;

  const job = ()=>{
    if(cleanup)  cleanup(); //下一次watch开始触发上一次的cleanup
    const newVal = effect.run()
    cb(newVal,oldVal,onCleanup)
    oldVal = newVal
  }
  const effect = new ReactiveEffect(getter,job)
  oldVal =  effect.run()
}