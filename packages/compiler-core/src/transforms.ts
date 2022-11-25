import { NodeTypes ,createVnodeCall} from "./ast";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, FRAGMENT, OPEN_BLOCK, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(ast){
  // 对tree进行遍历
  const context = createTransformContext(ast)
  console.log(ast,context);
  traverse(ast,context)
  createRootCodegen(ast,context)
  ast.helpers = [...context.helpers.keys()]

  //  根据转化的ast生成代码

}

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
        if(currentCount){
          context.helpers.set(name,count)
        }else{
          context.helpers.delete(name)
        }
      }
    },
    nodeTransforms:[
      transformElement,//元素
      transformText,//文本
      transformExpression//表达式
    ]
  }
  return context
}

function traverse(node,context){
  context.currentNode = node
  const transforms = context.nodeTransforms
  const exitsFns = []
  for(let i = 0 ; i < transforms.length ; i++){
     //在执行这个的时候  有可能这个node被删除了
    let onExit = transforms[i](node,context)
    onExit && exitsFns.push(onExit)
    //如果当前节点被删除了 就不考虑儿子节点了
    if(!context.currentNode) return 
  }
  switch(node.type){
    case NodeTypes.INTERPOLATION:
        // {{aa}}
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
  // 从里面向外一层一层执行
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
      ast.codegenNode = child.codegenNode
    }
  }else{
    ast.codegenNode = createVnodeCall(context,context.helper(FRAGMENT),null,ast.children)
    context.helper(OPEN_BLOCK)
    context.helper(CREATE_ELEMENT_BLOCK)
    ast.codegenNode.isBlock = true 
  }
}
