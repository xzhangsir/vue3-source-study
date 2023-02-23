monorepo 管理项目 （pnpm 默认支持）
npm install pnpm -g
pnpm init
新建文件 pnpm-workspace.yaml
新建文件夹 packages  
 packages/shared 多个包之间共享的内容

pnpm install vue -w [-w] 就是根目录

幽灵依赖 比如：vue 依赖了 loadsh 我们在开发的时候可以直接使用 loadsh
但是如果有一天 vue 不依赖 loadsh 了 那就有问题了 这种在 pnpm 中就叫幽灵依赖

npmrc 文件中的 shamefully-hoist = true 就是保持和 npm 一样 羞耻提升

```
pnpm install typescript esbuild minimist -w -D
```

pages/reactivity pnpm init ->package.json

"buildOptions":{
"name":"VueReactivity", //打包的名字
"formats":[ // 打包的格式
"global",
"cjs",
"esm-bundler"
]
},

```
pnpm tsc --init   // typescript 配置文件生成 tsconfig.json
```

{
"compilerOptions": {
"outDir": "dist", //输出目录
"sourceMap": true, // 采用 sourceMap
"target": "es2016", // 目标语法
"module": "esnext", // 模块格式
"moduleResolution": "node", //模块解析方式
"strict": true, //严格模式
"resolveJsonModule": true,// 解析 json 模块
"esModuleInterop": true, // 允许通过 es6 语法引入 commonjs 模块
"jsx": "preserve", //jsx 不转义
"lib": ["esnext","dom"], // 支持的类库 esnext 及 dom /_ Skip type checking all .d.ts files. _/
"baseUrl":".",
"paths":{ // 所有@vue 的引用都去 packages/_/src 找
"@vue/_":["packages/*/src"]
}
}
}

// 指定打包的模块 和 打包的格式
"dev": "node script/dev.js reactivity -f global"

compiler-core 模板解析核心，与具体环境无关，主要生成 AST，并根据 AST 生成 render() 函数
compiler-dom 浏览器环境中的模板解析逻辑，如处理 HTML 转义、处理 v-model 等指令
compiler-sfc 负责解析 Vue 单文件组件
compiler-ssr 服务端渲染环境中的模板解析逻辑
reactivity 响应式数据相关逻辑
runtime-core 与平台无关的运行时核心
runtime-dom 浏览器环境中的运行时核心
runtime-test 用于自动化测试的相关配套
server-renderer 用于 SSR 服务端渲染的逻辑
shared 一些各个包之间共享的公共工具
size-check 一个用于测试 tree shaking 后代码大小的示例库
template-explorer 用于检查模板编译后的输出，主要用于开发调试
vue Vue3 的主要入口，包含不同版本的包

https://vue-next-template-explorer.netlify.app/
