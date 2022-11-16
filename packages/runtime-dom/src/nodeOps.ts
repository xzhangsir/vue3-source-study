// 节点操作


export const nodeOps = {
  // 增加
  insert(child,parent,anchor = null){
    // 如果anchor为null, insertBefore等价于appendChild
    parent.insertBefore(child,anchor)
  },
  // 删除
  remove(child){
    const  parentNode = child.parentNode
    if(parentNode){
      parentNode.removeChild(child)
    }
  },
  // 修改
  // 修改文本内容
  setElementText(el,text){
    // 不能直接使用innnerHTML，因为会执行脚本
    el.textContent = text
  },
  // 修改文本元素
  setText(node,text){
    node.nodeValue = text
  },
  // 查询
  querySelector(selector){
    return  document.querySelector(selector)
  },
  parentNode(node){
    return node.parentNode
  },
  nextSibling(node){
    return node.nextSibling
  },
  // 创建
  createElement(tagName){
    return document.createElement(tagName)
  },
  // 创建文本
  createText(text){
    return document.createTextNode(text)
  }


}