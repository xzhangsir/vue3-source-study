import { hasChanged, isArray, isObject } from "@vue/shared"
import { activeEffect,  triggerEffects } from "./effect"
import { reactive } from "./reactive"


class RefImpl{
  // 保留原有的 value，需要用来比较 set 的新的值，
  // 因为_value有可能是响应式的对象所以不能用 _value 来比较
  private _rawVal:any
  private _value:any
  public __v_isRef = true
  public dep = new Set()

  constructor(val){
    this._rawVal = val
    // 如果val是对象 需要处理成reactive
    this._value = toReactive(val)
  }
   // 访问 value 属性就直接返回这个 _value
  get value(){
     // 收集依赖
    // 已经在 dep 中就不用 add 了
    if(!this.dep.has(activeEffect)){
      // 把对应的 effect 实例加入 set 里
      this.dep.add(activeEffect)
    }

    return this._value
  }
  set value(newVal){
    // 值没有发生变化 直接return
    if (!hasChanged(this._rawVal, newVal)) return
    this._rawVal = newVal
    this._value = toReactive(newVal)
    triggerEffects(this.dep)
  }
}



export function ref(val){
  return new RefImpl(val)
}

export function isRef(ref){
  // 如果传入的不是一个 ref对象 那他是没有__v_isRef属性的，那就是 undefined ，
  return !!ref.__v_isRef 
}

// 脱ref
export function unRef(ref){
  return isRef(ref) ? ref.value : ref
}


// 只是将.value属性代理到原始对象上
class ObjectRefImpl{
  constructor(public object,public key){}
  get value(){
    return this.object[this.key]
  }
  set value(newVal){
    this.object[this.key] = newVal
  }
}

export function toRef(reactive,key){
  return new ObjectRefImpl(reactive,key)
}

export function toRefs(obj){
  const ret = isArray(obj) ? new Array(obj.length) : {}
  for(const key in obj){
    ret[key] = toRef(obj,key)
  }
  return ret
}

export function proxyRefs(obj){
  return new Proxy(obj,{
    get(target,key){
      // 触发 get 的时候我们帮它 脱ref
      return unRef(Reflect.get(target,key))
    },
    set(target,key,newVal){
       // 如果当前已经是 ref 而传入的 值不是 ref，那么要给 .value 赋值
      if(isRef(target[key]) && !isRef(newVal)){
        return target[key].value = newVal
      }else{
        // 否则直接设置成 newValue即可
        return Reflect.set(target,key,newVal)
      }
    }
  })
}

function toReactive(val){
  return isObject(val) ? reactive(val) : val
}