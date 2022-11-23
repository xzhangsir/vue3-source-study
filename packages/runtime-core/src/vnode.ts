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
// 虚拟节点有很多种 比如：组件 元素 文本

export function createVnode(type,props,children = null,patchFlag = 0){

  let shapeFlag = 
    //string  说明是元素
    isString(type) ? ShapeFlags.ELEMENT : 
    // object 说明是组件(有状态组件)
    isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;

  const vnode = {
    type,
    props,
    children,
    el:null,//虚拟节点上对应的真实节点，后续diff算法
    key:props?.['key'],
    __v_isVnode:true,
    shapeFlag,
    patchFlag
  }
  if(children){
    let type = 0;
    if(isArray(children)){
      type = ShapeFlags.ARRAY_CHILDREN
    }else if(isObject(children)){
      type = ShapeFlags.SLOTS_CHILDREN
    }else{
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = shapeFlag | type
  }
  if(currentBlock && vnode.patchFlag > 0){
    currentBlock.push(vnode)
  }
  return vnode
}


let currentBlock = null
export function openBlock(){
  currentBlock = []
}

export function createElementBlock(type,props,children,PatchFlag){
  return setupBlock(createVnode(type,props,children,PatchFlag))
}

function setupBlock(vnode){
  vnode.dynamicChildren = currentBlock
  currentBlock = null
  return vnode
}

export function topDisplayString(val){
  return isString(val) ? val : val == null ? '' : isObject(val) ? JSON.stringify(val) : String(val)
}


export {createVnode as createElementVNode}
