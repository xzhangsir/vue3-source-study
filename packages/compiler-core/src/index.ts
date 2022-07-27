import { NodeTypes } from "./ast";

function createParserContext(template){
    return {
      line:1,   //第几行
      column:1, //第几列
      offset:0,    //偏移量
      source:template,  //此字段会被不停的进行解析  slice
      originalSource:template
    }
}

function isEnd(context){
  // 如果解析完毕后为空字符串 表示解析完毕
  return !context.source
}

function getCursor(context){
  let {line,column,offset} = context
  return {line,column,offset}
}
function advancePositionWithMutation(context,source,endIndex){
  let linesCount = 0;
  let linePos = -1;
  for(let i = 0 ; i < endIndex ; i++){
    if(source.charCodeAt(i) == 10){
      // 换行+1
      linesCount++;
      linePos = i
    }
  }
  context.line += linesCount
  context.offset += endIndex
  context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos
  
}
function advanceBy(context,endIndex){
  // 每次删除内容的时候  都要更新最新的行列和偏移量信息
  let source = context.source
  advancePositionWithMutation(context,source,endIndex)
  context.source = source.slice(endIndex)
}
function parseTextData(context,endIndex){
  const  rawText = context.source.slice(0,endIndex)
  advanceBy(context,endIndex)  //删除文本
  return rawText
}
function getSelection(context,start,end?){
  end = end || getCursor(context)
  return {
    start,
    end,
    source:context.originalSource.slice(start.offset,end.offset)
  }
}
function parseText(context){
  // abc<a></a>{{abc}}
  // 在解析文本的时候  要看后面到哪里结束
  let endTokens = ['<',"{{"]
  // 默认文本到最后结束
  let endIndex = context.source.length 
  for(let i = 0 ; i < endTokens.length ;i++){
    let index = context.source.indexOf(endTokens[i],1)
    // 找到了 并且第一次比整个字符串小
    if(index !== -1 && endIndex > index){
      endIndex = index
    }
  }

  // 创建 行列信息

  const start = getCursor(context) //开始位置
  // 取内容  advancePositionWithMutation再获取结束位置
  const content = parseTextData(context,endIndex)

  return {
    type:NodeTypes.TEXT,
    content:content,
    loc:getSelection(context,start)
  } 
  
}

function parse(template){
  // 创建一个解析的上下文 
  const context = createParserContext(template)

  //  <  元素
  //  {{}} 表达式
  //  其他 文本 注释等
  const nodes = []
  while(!isEnd(context)){
    const source  = context.source
    let node;
    if(source.startsWith("{{")){
      
    }else if(source.startsWith("<")){

    }

    // 文本
    if(!node){
      node = parseText(context)
      
    }
    nodes.push(node)
    break;
  }
  console.log(nodes);
  

  return context
}


export function compile(template){
  // 三部曲： 解析  转化  生成

  // 将模板 转化为抽象语法树  html -> ast
  const ast = parse(template)
  return ast

  // 对ast语法树进行预先处理
  // transform(ast)

  
  // return genderate(ast)  //最终生成代码
}
