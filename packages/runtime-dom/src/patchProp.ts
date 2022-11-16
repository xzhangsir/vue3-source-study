// DOM属性操作api
import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";
export function patchProp(el,key,prevValue,nextValue){
  // 类名  el.className
  if(key === 'class'){
    patchClass(el,nextValue)
  }else if(key === 'style'){
    // 样式   el.style
    patchStyle(el,prevValue,nextValue)
  }else if(/^on[^a-z]/.test(key)){
  // 事件  events  addEventListener
    patchEvent(el,key,nextValue)
  }else{
    // 普通属性  el.setAttribute
    patchAttr(el,key,nextValue)
  }

}