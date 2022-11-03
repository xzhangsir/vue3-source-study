import { isFunction } from "@vue/shared";
import { activeEffect, ReactiveEffect, triggerEffects } from "./effect";


class ComputedRefImpl{
  private _getter:any
  // 缓存变量 如果是 true 的时候说明有修改 需要更新 value
  private _dirty:boolean = true
  private _value:any
  // 保存 ReactiveEffect 实例
  private _effect: any
  private __v_isReadonly = true
  private __v_isRef = true
  public dep = new Set();
  constructor(getter,public setter){
    this._getter = getter
    this._effect = new ReactiveEffect(getter,()=>{
      // 当 dirty 是 false 的时候 改为 true 即表示已更新过了
      if (!this._dirty){
        this._dirty = true
        triggerEffects(this.dep)
      }
    })
  }
  get value(){
    // 做依赖收集 看这个计算属性 依赖了那些值
    // 当这些值变化的时候 计算属性重新计算
    this.dep.add(activeEffect)
    // dirty 不是true 说明value没有改变 直接返回value
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
  set value(newVal){
    this.setter(newVal)
  }
}


export function computed(getterOrOptions){
  let onlyGetter = isFunction(getterOrOptions)
  let getter,setter;
  if(onlyGetter){
    // computed传入 function 返回的就是只读的
    getter = getterOrOptions
    setter =()=>{console.warn("no set")}
  }else{
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  // console.log("v",getter)
  return new ComputedRefImpl(getter,setter)
  
}