import { ShapeFlags } from "@vue/shared"

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


  const mountChildren = (el,children)=>{
    for(let i = 0 ; i < children.length;i++){
        patch(null,children[i],el)
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
      hostInsert((newN.el = hostCreateText(newN.children)),container)
    }
  }


  // 核心的方法 参数：老节点 新节点 挂载的容器
  const patch = (oldN,newN,container)=>{
    if(oldN === newN) return null
    const {type,shapeFlag} = newN
    if(oldN === null){
      // 初次渲染（包括元素的初次渲染和组件的初次渲染）

      switch(type){
        case Text:
            processText(oldN,newN,container)
          break;
        default:
          if(shapeFlag & ShapeFlags.ELEMENT){
              mountElement(newN,container)
          }
      }


    }else{
      // 更新流程
    }

  }



  // 渲染过程是通过传入的 renderOptions 来渲染的
  const render = (vnode,container)=>{
    // console.log(vnode,container)

    if(vnode == null){
    // 卸载
    //如果vnode是空的 就清空container里面的内容 


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
