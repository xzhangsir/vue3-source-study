
// 一个虚拟节点 需要有 
// type props  children

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol("Text")
export const Fragment = Symbol("Fragment")

export function isVnode(val){
  return !!(val && val.__v_isVnode) 
}

export function isSameVnode(n1,n2){
  // 判断两个虚拟节点是不是同一个
  /**
   *  - 标签名相同
   *  - key一样
  */
 return (n1.type === n2.type) && (n1.key === n2.key)

}

// 虚拟节点有很多：比如：组件 元素 文本
export function createVnode(type,props,children = null){
  //组合方案 shapeFlag  标识
  //我想知道一个元素中包含的是多个儿子还是一个儿子

  let shapeFlag = 
  //string  说明是元素
  isString(type) ? ShapeFlags.ELEMENT : 
  // object 说明是组件
  isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;


  // 虚拟dom就是一个对象，方便diff算法
  const vnode = {
    type,
    props,
    children,
    el:null,//虚拟节点上对应的真是节点，后续diff算法
    key:props?.['key'],
    __v_isVnode:true,
    shapeFlag
  }

  if(children){
    let type = 0;
    if(isArray(children)){
      type = ShapeFlags.ARRAY_CHILDREN
    }else{
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = shapeFlag | type
  }

  return vnode
}