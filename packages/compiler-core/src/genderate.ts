import { NodeTypes } from "./ast"
import { helperMap, TO_DISPLAY_STRING } from "./runtimeHelpers"
export function genderate(ast){
  console.log("生成最终的代码",ast)
  const context = createCodeContext(ast)
  console.log(context)
/*    context.push("var a = 1")
  context.indent()
  context.push("var b = 2")
  context.deindent()
  context.push("console.log(a+b)")
  console.log(context.code) */
  const {push,indent,deindent} = context
  getFunctionPreable(ast,context)  //开头
  const functionName = "render"
  const args = ['_ctx','_cache',"$props"]

  push(`function ${functionName}(${args.join(',')}){`)
  indent()
  push(`return `)
  console.log(ast.codegenNode);

  if(ast.codegenNode){
    genNode(ast.codegenNode,context)

  }else{
    push("null")
  }

  deindent()
  push("}")

  // console.log(context.code);

  return context.code

}
function getFunctionPreable(ast,context){
  if(ast.helpers.length > 0 ){ 
    context.push(`import {${ast.helpers.map(h=>`${context.helper(h)} as _${context.helper(h)}`).join(',')}} from "vue"`)
    context.newline()
  }
  context.push("export ")
}

function createCodeContext(ast){
  const context = {
    code:'',  //最后的生成结果
    helper(name){
      return `${helperMap[name]}`
    },
    push(code){
      context.code += code
    },
    indentLevel:0, //层级
    indent(){ //向后缩减
      ++context.indentLevel
      context.newline()
    },  
    deindent(whithoutNewLine = false){//向前缩减
      --context.indentLevel
      if(!whithoutNewLine){
          context.newline()
      }
    },
    newline(){ //根据indentLevel生成新的行
      newline(context.indentLevel)
    }, 

  }
  function newline(n){
    context.push('\n' + "  ".repeat(n))
  }

  return context
}

function genNode(node,context){
  switch(node.type){
    case NodeTypes.TEXT:
      genText(node,context)
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node,context)
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node,context)
      break;
  }
}

function genText(node,context){
  context.push(JSON.stringify(node.content))
}
function genInterpolation(node,context){
  context.push(`_${helperMap[TO_DISPLAY_STRING]}(`)
  genNode(node.context,context)
  context.push(')')
}
function genExpression(node,context){
    context.push(node.content)
}

