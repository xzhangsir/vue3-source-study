import { createVnodeCall, NodeTypes } from "./ast"
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, FRAGMENT, OPEN_BLOCK, TO_DISPLAY_STRING } from "./runtimeHelpers";
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
    removeHelper(name){
      const count = context.helpers.get(name)
      if(count){
        const currentCount = count - 1
        if(!currentCount){
          context.helpers.delete(name)
        }else{
          context.helpers.set(name,currentCount)
        }
      }
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

function createRootCodegen(ast,context){
  let {children} = ast
  if(children.length === 1){
    const child = children[0]
    if(child.type === NodeTypes.ELEMENT && child.codegenNode){
      ast.codegenNode = child.codegenNode
      context.removeHelper(CREATE_ELEMENT_VNODE)
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_ELEMENT_BLOCK)
      ast.codegenNode.isBlock = true 
    }else{
      ast.codegenNode = child
    }
  }else{
    if(children.length == 0) return
    ast.codegenNode = createVnodeCall(context,context.helper(FRAGMENT),null,ast.children)
    context.helper(OPEN_BLOCK)
    context.helper(CREATE_ELEMENT_BLOCK)
    ast.codegenNode.isBlock = true 
  }
}

export function transform(ast){
  // 对tree进行遍历
  // console.log(ast);
  
  const context = createTransformContext(ast)
  // console.log(context);
  traverse(ast,context)

  createRootCodegen(ast,context)

  ast.helpers = [...context.helpers.keys()]


  // 根据转化的ast生成代码

  
}
