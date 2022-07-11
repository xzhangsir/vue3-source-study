import { isArray, isObject } from "@vue/shared"
import { callWithAsyncErrorHandling } from "vue";
import { triggerEffects ,activeEffect} from "./effect";
import { reactive} from "./reactive"

function toReactive(val){
  return isObject(val) ? reactive(val):val
}


class RefImpl{
  public _value;
  public dep = new Set()
  public __v_isRef = true
  constructor(public rawVal){
    this._value = toReactive(rawVal)
  }
  get value(){  
    this.dep.add(activeEffect)
    return this._value
  }
  set value(newVal){
    // 如果新值 不等 老值 再更新
    if(newVal !== this.rawVal){
      this._value = toReactive(newVal)
      this.rawVal = newVal
      triggerEffects(this.dep)
    }
  }
}


export function ref(val){
  return new RefImpl(val)
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

function toRef(object,key){
  return new ObjectRefImpl(object,key)

}

export function toRefs(object){
  const result = isArray(object) ? new Array(object.length) : {}
  
  for(let key in object){
    result[key] = toRef(object,key)
  }

  return result

}

export function proxyRefs(object){
  return new Proxy(object,{
    get(target,key,recevier){
      let r = Reflect.get(target,key,recevier)
      return r.__v_isRef ? r.value : r
    },
    set(target,key,value,recevier){
      let oldVal = Reflect.get(target,key,recevier)
      if(oldVal.__v_isRef){
        oldVal.value = value
        return true
      }else{
        return Reflect.set(target,key,value,recevier)
      }
    }
    
  })

}