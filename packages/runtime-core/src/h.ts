import { isArray, isObject } from "@vue/shared"
import { createVnode, isVnode } from "./vnode"
// import { createVnode, isVnode } from "./vnode"

// h的写法
// h("div")

// h("div","hello")
// h("div",{style:{color:"red"}})
// h("div",h("span"))
// h("div",[h("span"),h("span")])

// h("div",{style:{color:"red"}},"hello")
// h("div",null,"hello")
// h("div",null,"hello",'world')
// h("div",null,h("span"))
// h("div",null,[h("span"),h("span")])

export function h(type,propsChildren?,children?){
  const l = arguments.length
  if(l === 2){
    // h("div","hello")
    // h("div",{style:{color:"red"}})
    // h("div",h("span"))
    // h("div",[h("span"),h("span")])
    if(isObject(propsChildren) && !isArray(propsChildren)){
      if(isVnode(propsChildren)){
        return createVnode(type,null,[propsChildren])
      }
      // 属性
        return createVnode(type,propsChildren)
    }else{
      return createVnode(type,null,propsChildren)
    }

  }else{
    if(l > 3){
      children = Array.from(arguments).slice(2)
    }else if(l=== 3 && isVnode(children)){
      // h("div",{},h("span"))
       children = [children]
    }
    // children  可能是文本 也可能是数组
    return createVnode(type,propsChildren,children)
  }
  
}