monorepo 管理项目 （pnpm 默认支持）
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

## Vue 中为了解耦，将逻辑分成了两个模块

- 运行时（runtime-core） 核心（不依赖平台 不论是 浏览器 小程序 APP canvas） 主要靠 虚拟 dom
- 针对不同平台的运行时(runtime-dom) Vue 就是针对浏览器平台的
- 渲染器 createRenderer

https://vue-next-template-explorer.netlify.app/
