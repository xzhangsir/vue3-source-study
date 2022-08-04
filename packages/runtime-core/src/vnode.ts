
// 一个虚拟节点 需要有 
// type props  children

import { isArray, isFunction, isObject, isString, ShapeFlags } from "@vue/shared";
import { isTeleport } from "./components/Teleport";

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
export function createVnode(type,props,children = null,patchFlag = 0){
  //组合方案 shapeFlag  标识
  //我想知道一个元素中包含的是多个儿子还是一个儿子
  let shapeFlag = 
    //string  说明是元素
    isString(type) ? ShapeFlags.ELEMENT : 
    // 说明是个 teleport 传送门
    isTeleport(type) ? ShapeFlags.TELEPORT : 
    isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT:
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
    shapeFlag,
    patchFlag
  }

  if(children){
    let type = 0;
    if(isArray(children)){
      type = ShapeFlags.ARRAY_CHILDREN
    }else if(isObject(children)){
      // 如果是对象  表示组件带有插槽
      type = ShapeFlags.SLOTS_CHILDREN
    }else{
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = shapeFlag | type
  }

  if(currnetBlock && vnode.patchFlag > 0){
    currnetBlock.push(vnode)
  }

  return vnode
}


let currnetBlock = null
export function openBlock(){
  currnetBlock = []
}

export function createElementBlock(type,props,children,patchFlag){
  return setupBlock(createVnode(type,props,children,patchFlag))
}

function setupBlock(vnode){
  vnode.dynamicChildren = currnetBlock
  currnetBlock = null
  return vnode
}

export function topDisplayString(val){
  return isString(val) ? val : val == null ? '' : isObject(val) ? JSON.stringify(val) : String(val)
}


export {createVnode as createElementVNode}

// 模板编译优化 增添了patchFlag  来标识那些节点是动态的
// block 来收集节点 为不稳定结构也创建block节点 实现blockTree做到靶向更新
//编译中的优化： 静态提升  属性的提升 和 虚拟节点的提升  函数的缓存 预先解析字符串
// 模板的性能更好
