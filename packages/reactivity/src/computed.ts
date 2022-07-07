import { isFunction } from "@vue/shared";
import {activeEffect, ReactiveEffect,triggerEffects} from "./effect"

class ComputedRefImpl{
  public effect;
  public _disty  = true; //默认应该取值的时候进行计算
  public __v_isReadonly = true
  public __v_isRef = true
  public _value;
  public dep = new Set();
  constructor(getter, public setter){
    // 我们将用户的getter放到effect中，这里面的
    // firName和lastName就会被这个effect收集起来
    this.effect = new ReactiveEffect(getter,()=>{
      //  firName和lastName变化就会执行这个调度函数
      if(!this._disty){
        this._disty = true
        triggerEffects(this.dep)
      }
    })
  }
  // 类中的属性访问器 底层是Object.defineProperty
  get value(){
    // 做依赖收集 看这个计算属性 依赖了那些值
    // 当这些值变化的时候 计算属性重新计算
    this.dep.add(activeEffect)
    if(this._disty){  //说明这个值是脏的，就是改过的
      this._disty = false
      this._value = this.effect.run()
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
    // 传入的是个function
    getter = getterOrOptions
    setter = ()=>{console.warn("no set")}
  }else{
    // 传入的是个options
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter,setter)
}