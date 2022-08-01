import { PatchFlags } from "@vue/shared";
import { createCallExpression, NodeTypes } from "../ast";

export function isText(node){
  // 判断是不是 模板表达式  或者 文本
  return node.type === NodeTypes.INTERPOLATION  || node.type === NodeTypes.TEXT
}


export function transformText(node,context){
  if(node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT){
    return ()=>{
      let currentContainer = null
      let children = node.children
      let hasText = null
      for(let i = 0 ; i < children.length ; i++){
        let child = children[i]
        hasText = true
        // 看当前的节点是不是文本
        if(isText(child)){
          // 看下一个节点是不是文本
          for(let j = i + 1; j < children.length ;j++){
            let next = children[j]
            if(isText(next)){
                if(!currentContainer){
                  currentContainer = children[i] = {
                    type:NodeTypes.COMPOUND_EXPRESSION,
                    children:[child]
                  }
                }

                currentContainer.children.push("+",next)
                children.splice(j,1)
                j--;
                // createElementVnode(div,toDispalyString(__ctx.aaa) + '123')
            }else{
              currentContainer = null
              break;
            }
          }
        }
      }
      if(!hasText || children.length === 1){
        return
      }

      // 需要个多个儿子中的创建文本节点添加patchFlag


      for(let i = 0 ; i < children.length ; i++){
        const child = children[i]
        const callArgs = []
        if(isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION){
          callArgs.push(child)
          if(node.type !== NodeTypes.TEXT){
            // 动态节点
            callArgs.push(PatchFlags.TEXT) //用于靶向更新
          }
          children[i] = {
            type:NodeTypes.TEXT_CALL,  //通过createTextVnode来实现
            content :child,
            codegenNode:createCallExpression(context,callArgs)
          }
        }
        
      }
      
      
        
      
     }
  }
}