import { NodeTypes } from "../ast";

export function transformExpression(node,context){
 // {{ aa }}
  // console.log(node);
  if(node.type === NodeTypes.INTERPOLATION){
   let content = node.content.content
    node.content.content = `__ctx.${content}`
  }
}