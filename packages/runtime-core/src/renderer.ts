import { isString, ShapeFlags } from "@vue/shared"
import { createVnode, isSameVnode,Text } from "./vnode"

export function createRenderer(renderOptions){
  // console.log(renderOptions)
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
    patchProp:hostPatchProp,
    querySelector

  } = renderOptions

   const normalize = (children,i)=>{
    // 将 字符串文本 转为 （Text,"字符串"）
    if(isString(children[i])){
       let vnode = createVnode(Text,null,children[i])
       children[i] = vnode
    }
    return children[i]
  }
  const unmountChildren = (children)=>{
    for(let i = 0 ; i < children.length ; i++){
      unmount(children[i])
    }
  }


  const mountChildren=(el,children)=>{
    for(let i = 0 ; i < children.length;i++){
        //patch(null,children[i],el)
        let child = normalize(children,i)
        patch(null,child,el)
    }
  }

  const mountElement=(vnode,container)=>{
    let {type,props,children,shapeFlag} = vnode
    // 将创建的真实元素挂载到虚拟节点上，后续方便复用节点和更新
      let el = vnode.el = hostCreateElement(type)
      // console.log("props",props)
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


      // console.log(el)
      // 将创建的元素插入到容器中
      hostInsert(el,container)

  }
  
  const patchProps = (oldProps,newProps,el)=>{
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

  const patchKeyChildren = (c1,c2,el)=>{
    // 比较两个儿子的差异

  }

  const patchChildren = (oldN,newN,el)=>{
    // 比较两个虚拟节点的儿子的差异
    // el就是当前的父节点
    const c1 = oldN && oldN.children
    const c2 = newN && newN.children

    // 获取之前和当前需要更新的节点 shapeFlag
    const prevShapeFlag = oldN.shapeFlag
    const activeShapeFlag = newN.shapeFlag

    // 儿子可能是  文本 空的null 或者 数组
    // 比较两个儿子列表的差异
    /**
     * 
     * -  新儿子    旧儿子    操作方式
     *  
     *    文本      数组      删除旧儿子，设置文本内容
     *    文本      文本      更新文本即可
     *    文本       空       同上（更新文本即可）
     * 
     *    数组       数组      diff算法
     *    数组       文本      清空文本 ，进行挂载
     *    数组        空        直接进行挂载
     * 
     *    空        数组        删除所有儿子
     *    空        文本        清空文本
     *    空        空          不处理
    */
    if(activeShapeFlag & ShapeFlags.TEXT_CHILDREN){
      // 现在变 文本
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // 如果原来的是数组  先删除所有的子节点
        unmountChildren(c1)
      }
      if(c1 !== c2){
        hostSetElementText(el,c2)
      }
    }else if(activeShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      // 现在变数组
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // diff算法 之前是数组
        patchKeyChildren(c1,c2,el)  //全量比对

      }else if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
        // 之前是文本
        // 先清空文本
         hostSetElementText(el,"")
         mountChildren(el,c2)
      }
    }else{
       // 现在变空 
      hostSetElementText(el,"")
    }
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
      patchElement(oldN,newN)
    }
  }

  const patch = (oldN,newN,container) =>{
    if(oldN === newN) return null
    // 新老节点 完全不一致  直接删除老的 再创建新的
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