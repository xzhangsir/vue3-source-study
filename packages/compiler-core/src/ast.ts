export const enum NodeTypes {
  ROOT,   //根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT, // 注释
  SIMPLE_EXPRESSION,// 简单表达式 aa
  INTERPOLATION,// 模板表达式  {{aa}}
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,// 复合表达式  {{aa}} bb
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,// 文本调用
  // codegen
  VNODE_CALL,//元素调用
  JS_CALL_EXPRESSION,// JS调用表达式
}