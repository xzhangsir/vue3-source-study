import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers";
import { transformElement } from "./transforms/transformElement"
import { transformExpression } from "./transforms/transformExpression"
import { transformText } from "./transforms/transformText"


function createTransformContext(root){
  const context = {
    currentNode:root, //当前正在转化的是谁
    parent:null, // 当前转化的父节点是谁
    helpers:new Map(),  //优化
    helper(name){ // 根据使用的方法次数进行优化
      const count = context.helpers.get(name) || 0
      context.helpers.set(name,count + 1) 
      return name
    },
    nodeTransforms:[
      transformElement,
      transformText,
      transformExpression
    ]
  }
  return context
}

function traverse(node,context){
    context.currentNode = node
    const  transforms = context.nodeTransforms
    const exitsFns = []
    for(let i = 0 ; i < transforms.length ;i++){
      let onExit = transforms[i](node,context) //在执行这个的时候  有可能这个node被删除了
      onExit && exitsFns.push(onExit)
      if(!context.currentNode) return  //如果当前节点被删除了 就不考虑儿子节点了

    }
    switch(node.type){
      case NodeTypes.INTERPOLATION:
        context.helper(TO_DISPLAY_STRING)
        break;
      case NodeTypes.ELEMENT:

      case NodeTypes.ROOT:
        for(let i = 0 ; i < node.children.length ;i++){
          context.parent = node
          traverse(node.children[i],context)
        }
        break;
    }
    // 当执行退出函数的时候 保证 currentNode 指向的依旧是正确的
    context.currentNode = node
    let i = exitsFns.length
    while(i--){
      exitsFns[i]()
    }
}

export function transform(ast){
  // 对tree进行遍历
  console.log(ast);
  
  const context = createTransformContext(ast)
  console.log(context);
  traverse(ast,context)
  
}
