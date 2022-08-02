import { parse } from "./parse"
import { transform } from "./transforms"
import {genderate} from "./genderate"

export function compile(template){
  // 三部曲： 解析  转化  生成

  // 将模板 转化为抽象语法树  html -> ast
  const ast = parse(template)
  // return ast

  // 对ast语法树进行预先处理
  // <div>{{aa}} 123</div> => createElementVnode('div',toDisplayString(aa) + 123)
  transform(ast)

  
  return genderate(ast)  //最终生成代码
}
