import { NodeTypes } from "../ast";

export function transformExpression(node,context){
 // {{ aa }}
 
  // console.log(node,context);
  if(node.type === NodeTypes.INTERPOLATION){
    console.log("{{}}",node)
   let content = node.context.content
    node.context.content ==  `__ctx.${content}`
  }
}