import { NodeTypes,createObjectExpression, createVnodeCall } from "../ast";

export function transformElement(node,context){
 if(node.type === NodeTypes.ELEMENT){
     return ()=>{
         console.log("元素"); 
         let vnodeTag = `${node.tag}`
         let properties = []
         let props = node.props
         for(let i = 0 ; i < props.length  ;i++){
            properties.push({
               key:props[i].name,
               value:props[i].value.content
            })
         }
         console.log("properties",properties)
         // 创建一个属性的表达式
         const propsExpression = properties.length > 0 ? createObjectExpression(properties) : null

         let childrenNode = null
         if(node.children.length == 1){
            childrenNode = node.children[0]
         }else if(node.children.length > 1){
            childrenNode = node.children
         }

          node.codegenNode = createVnodeCall(context,vnodeTag,propsExpression,childrenNode)

     }
  }
}
