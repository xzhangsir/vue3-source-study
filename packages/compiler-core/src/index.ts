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
  const source = context.source
  if(source.startsWith('</')){
    return true
  }
  return !source
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

// 处理插值表达式
function parseInterpolation(context){
  const start = getCursor(context)
  // 查找结束的大括号
  const closeIndex = context.source.indexOf("}}","{{".length)
  advanceBy(context,2)  //删掉 {{

  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)
  
  // 拿到大括号中内容的长度
  const rawContentLength = closeIndex - 2;
  // 拿到文本内容   且更新了行列 偏移量信息
  let preContent = parseTextData(context,rawContentLength)
  let content = preContent.trim()

  let startOffset = preContent.indexOf(content)

  if(startOffset > 0 ){
    advancePositionWithMutation(innerStart,preContent,startOffset)
  }
  
  let endOffset = startOffset + content.length

  advancePositionWithMutation(innerEnd,preContent,endOffset)

  advanceBy(context,2)  //删掉 }}

  return {
    type:NodeTypes.INTERPOLATION,
    context:{
      type:NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc:getSelection(context,innerStart,innerEnd)
    },
    loc:getSelection(context,start)
  }
}

// 删空格 <div     >
function advanceBySpaces(context){
  let match = /^[ \t\r\n]+/.exec(context.source)
  if(match){
      advanceBy(context,match[0].length) 
  }
}
function parseAttributeValue(context){
    const start = getCursor(context)
    let quote = context.source[0]
    let content;
    // 判断是单引号还是双引号  还有可能没有 先不处理
    if(quote == '"' || quote == "'"){
      advanceBy(context,1)
      const endIndex = context.source.indexOf(quote)
      content = parseTextData(context,endIndex)
      advanceBy(context,1)
    }

    return {
      content,
      loc:getSelection(context,start)
    }
    
}

function parseAttribute(context){
  const start = getCursor(context)

  // 属性的名字
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  let name = match[0]
  advanceBy(context,name.length)
  advanceBySpaces(context) //删空格
  advanceBy(context,1)  //删 等于号 =
  advanceBySpaces(context) //删空格
  let value = parseAttributeValue(context)

  
  return {
    type:NodeTypes.ATTRIBUTE,
    name,
    value:{
      type:NodeTypes.TEXT,
      ...value
    },
    loc:getSelection(context,start)
  }

}
// 处理属性
function parseAttributes(context){
  const props = []
  const source = context.source
  while(source.length > 0 && !(source.startsWith('>') || source.startsWith('/>'))){
    const prop = parseAttribute(context)
    props.push(prop)
    advanceBySpaces(context)
  }
  return props

}
function parseTag(context){
  const start = getCursor(context);
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1]  //标签名
  // console.log(tag);
  advanceBy(context,match[0].length)  //删除标签 <div
  advanceBySpaces(context)   // 删空格 <div     >
  // 处理属性
  let props = parseAttributes(context)
  // 判断是不是一个自闭和标签
  
  let isSelfClosing = context.source.startsWith("/>")

  advanceBy(context,isSelfClosing?2:1)   //删除 /> 或者 >

  return {
    type:NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    children:[],
    props,
    loc:getSelection(context,start)
  }

}
// 处理标签
function parseElement(context){
  // <div>
 let ele = parseTag(context)
  // div中间的部分
  let children = parseChildren(context)
  //  </div>
 if(context.source.startsWith("</")){
    parseTag(context)
  }
  ele.loc = getSelection(context,ele.loc.start)  //计算最新的位置信息
  ele.children = children
  return ele
}

function parse(template){
  // 创建一个解析的上下文 
  const context = createParserContext(template)

  return parseChildren(context)
  
}

function parseChildren(context){
  //  <  元素
  //  {{}} 表达式
  //  其他 文本 注释等
  const nodes = []
  while(!isEnd(context)){
    const source  = context.source
    let node;
    if(source.startsWith("{{")){
      node = parseInterpolation(context)
    }else if(source.startsWith("<")){
      node = parseElement(context)
    }
    
    // 文本
    if(!node){
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
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
