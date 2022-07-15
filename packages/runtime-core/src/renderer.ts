import { isString, ShapeFlags } from "@vue/shared"
import { createVnode,Text,isSameVnode } from "./vnode"

export function createRenderer(renderOptions){

  let {
  // 增加
  insert:hostInsert,
  // 删除
  remove:hostRemove,
  // 修改
  // 修改文本内容
  setElementText:hostSetElementText,
  // 修改文本元素
  setText:hostSetText,
  parentNode:hostParentNode,
  nextSibling:hostNextSibling,
  // 创建
  createElement:hostCreateElement,
  // 创建文本
  createText:hostCreateText,
  // 属性操作
  patchProp:hostPatchProp

} = renderOptions


  const normalize = (child)=>{
    // 将 字符串文本 转为 （Text,"字符串"）
    if(isString(child)){
       return createVnode(Text,null,child)
    }
    return child
  }

  const mountChildren = (el,children)=>{
    for(let i = 0 ; i < children.length;i++){
      let child = normalize(children[i])
      patch(null,child,el)
    }
  }


  const mountElement = (vnode,container)=>{
    let {type,props,children,shapeFlag} = vnode
    // 将创建的真实元素挂载到虚拟节点上，后续方便复用节点和更新
    let el = vnode.el = hostCreateElement(type)

    if(props){

      for(let key in props){
        hostPatchProp(el,key,null,props[key])
      }

    }

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
      // 判断children是不是文本节点
      hostSetElementText(el,children)

    }else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN){
      // 判断children是个数组
      mountChildren(el,children)

    }


    // 将创建的元素插入到容器中
    hostInsert(el,container)


  }

  const processText = (oldN,newN,container)=>{
    if(oldN === null){
      // 文本初次渲染
      hostInsert((newN.el = hostCreateText(newN.children)),container)
    }else{
      // 文本更新 节点复用 只改文本
      const el = newN.el = oldN.el
      if(newN.children !== oldN.children){
        hostSetText(el,newN.children)
      }
    }
  }

  const patchProps = (oldProps,newProps,el) => {
    // 新的里面有，直接用新的盖掉老的
    for(let key in newProps){
      hostPatchProp(el,key,oldProps[key],newProps[key])
    }
    // 如果老的里面有 新的没有  则是删除
    for(let key in oldProps){
      if(newProps[key] == null){
        hostPatchProp(el,key,oldProps[key],null)
      }
    }

  }

  const patchChildren = (oldN,newN,el)=>{
    // 比较两个虚拟节点的儿子的差异
    // el就是当前的父节点
    const c1 = oldN && oldN.children
    const c2 = newN && newN.children

    // 儿子可能是  文本 空的 或者 数组
    // 比较两个儿子列表的差异

  }

  const patchElement = (oldN,newN)=>{
    let el = newN.el = oldN.el

    let oldProps = oldN.props || {}
    let newProps = newN.props || {}
    // 先比较属性  
    patchProps(oldProps,newProps,el)
    // 再比较儿子
    patchChildren(oldN,newN,el)

  }

  const processElement = (oldN,newN,container)=>{
    if(oldN === null){
      // 初次渲染（包括元素的初次渲染和组件的初次渲染）
      mountElement(newN,container)
    }else{
      // 更新流程
      /**
       * - 如果前后完全没有关系，删除老的，添加新的
       * - 老的和新的一样 复用 ，属性可能不一样 再对比属性，更新属性
       * - 比儿子
      */
      patchElement(oldN,newN,container)
    }
  }


  // 核心的方法 参数：老节点 新节点 挂载的容器
  const patch = (oldN,newN,container)=>{
    if(oldN === newN) return null

    // 新老节点完全不一致 直接删除老的 再 创建新的
    if(oldN && !isSameVnode(oldN,newN)){
      unmount(oldN)
      oldN = null
    }


    const {type,shapeFlag} = newN

    switch(type){
      case Text:
          processText(oldN,newN,container)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(oldN,newN,container)
        }
    }
  }

  const unmount = (vnode)=>{
    hostRemove(vnode.el)
  }

  // 渲染过程是通过传入的 renderOptions 来渲染的
  const render = (vnode,container)=>{
    // console.log(vnode,container)
    
    if(vnode == null){
    // 卸载
    //如果vnode是空的 就清空container里面的内容 
      if(container._vnode){
        unmount(container._vnode)
      }
    }else{
      // 挂载
      // 既有初始化的逻辑 又有更新的逻辑
      patch(container._vnode || null,vnode,container)

    }
    //将上一个的虚拟节点缓存起来
    container._vnode = vnode

    

  }
  return {
    render
  }
  
}
// 文本的处理，需要自己增加类型（Text） 
// 因为不能通过document.createElement("文本")创建文本节点
