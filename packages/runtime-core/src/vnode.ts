// 一个虚拟节点 需要有 
// type props  children

import { isArray, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol("Text")

export function isVnode(val){
  return !!(val && val.__v_isVnode)
}
// 虚拟节点有很多种 比如：组件 元素 文本

export function createVnode(type,props,children = null){

  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  const vnode = {
    type,
    props,
    children,
    el:null,//虚拟节点上对应的真实节点，后续diff算法
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
