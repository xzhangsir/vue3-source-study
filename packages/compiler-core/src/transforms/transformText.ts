import { NodeTypes } from "../ast";
export function transformText(node,context){
  if(node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT){
    return ()=>{
        console.log("退出2");
      
     }
  }
}