
import { isArray, isFunction, isObject } from "@vue/shared"
import { ReactiveEffect } from "./effect"
import { isReactive } from "./reactive"
import { isRef } from "./ref"

// source是用户传入的对象
// cb就是对应的用户的回调
// immediate : true  回调函数会在 watch 创建的时候立即执行一次
export function watch(source,cb,options?){
  return doWatch(source,cb,options)
}

function doWatch(source,cb,{ immediate, deep, flush, onTrack, onTrigger }){
  let getter :()=>any

  if(isRef(source)){
    getter = source.value
  }else if(isReactive(source)){
    getter = ()=> source
    deep = true
  }else if(isArray(source)){
    getter = ()=>
      source.map(s=>{
        if(isRef(s)){
          return s.value
        }else if(isReactive(s)){
          return traverse(s)
        }else if(isFunction(s)){
          return s()
        }
      })
  }else if(isFunction(source)){
    getter = ()=> source()
  }

  if(cb && deep){
     // 如果有回调函数并且深度监听为 true，那么就通过 traverse 函数进行深度递归监听
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }
  // 定义老值
  let oldValue;
  // 提取 scheduler 调度函数为一个独立的 job 函数
  const job = ()=>{
    // 在 scheduler 中重新执行 reactive effect 实例对象的run方法，得到的是新值
    let newValue = effect.run()
    // 将新值和旧值作为回调函数的参数
    cb(newValue,oldValue)
    // 更新旧值，不然下一次会得到错误的旧值
    oldValue = newValue
  }
  // 使用 job 函数作为调度器函数
  const scheduler = ()=>job()

  const effect = new ReactiveEffect(getter,scheduler)
  if(immediate){
     // 当 immediate 为 true 时立即执行 job，从而触发回调函数执行
    job()
  }else{
    // 手动执行 reactive effect 实例对象的 run 方法，拿到的值就是旧值
    oldValue = effect.run()
  }
}


export function traverse(value:unknown,seen?:Set<unknown>){
  // 如果是普通类型或者不是响应式的对象就直接返回
  if(!isObject(value)){
    return value
  }
  seen = seen || new Set()
  if(seen.has(value)){
    // 如果已经读取过就返回
    return value
  }
  // 读取了就添加到集合中，代表遍历地读取过了，避免循环引用引起死循环
  seen.add(value)
  if (isRef(value)) {
      // 如果是 ref 类型，继续递归执行 .value值
      //   traverse(value.value, seen)
  } else if (Array.isArray(value)) {
      // 如果是数组类型
      for (let i = 0; i < value.length; i++) {
      // 递归调用 traverse 进行处理
      traverse(value[i], seen)
      }
  } else if (isObject(value)) {
      // 如果是对象，使用 for in 读取对象的每一个值，并递归调用 traverse 进行处理
      for (const key in (value as any)) {
      traverse((value as any)[key], seen)
      }
  }
  return value

}