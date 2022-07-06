import { isObject } from "@vue/shared";
import {mutableHandlers} from "./baseHandler"
// 缓存所有被代理的对象
// 防止用户多次代理同一个对象
/**
 * let obj = {name:zx}
 * let state1 = reactive(obj)
 * let state2 = reactive(obj)
 * console.log(state1 === state2) //false
*/
// WeakMap  key只能是对象
const reactiveMap = new WeakMap() 


//判断这个对象有没有被代理过
//防止用户传入一个代理过的对象
/**
 * let obj = {name:"zx"}
 * let state1 = reactive(obj)
 * let state2 = reactive(state1)
 * 
*/
//TS 独有  枚举
// export   const enum ReactiveFlags {
//   IS_REACTIVE = '__v_isReactive'
// }
import {ReactiveFlags} from "./baseHandler"


// 1)  将数据转化为响应式数据
export function reactive(target){
  //首先必须是对象
  if(!isObject(target)) return
  //如果缓存中有这个代理对象 就不再进行代理
  if(reactiveMap.has(target)){
    return reactiveMap.get(target)
  }
  //如果target是一个代理过的对象 也就不再进行代理
  if(target[ReactiveFlags.IS_REACTIVE]){
    return target
  }
  //对传入的值进行代理
  const proxy = new Proxy(target,mutableHandlers)

  reactiveMap.set(target,proxy)

  return proxy
}

//为什么不能这样写
/**
 * let target = {
      _name:"zx",
      get  name(){  //对象属性访问器
        return this._name
      }
    }
    const proxy = new Proxy(target,{
      get(target,key,receiver){
        return target[key]
      },
      set(target,key,value,receiver){
        target[key] = value
        return true
      }
    })

    proxy.name
 * 
*/

//因为获取name的时候get执行了一次，
//但获取 this._name时get未执行 因为此时的this是target而不是代理对象
//使Reflect时this就指向了代理对象 proxy 会执行两次