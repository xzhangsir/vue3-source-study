monorepo 管理项目  （pnpm默认支持）

pnpm install vue -w  [-w] 就是根目录

幽灵依赖  比如：vue依赖了loadsh  我们在开发的时候可以直接使用loadsh 
但是如果有一天vue不依赖loadsh了  那就有问题了   这种在pnpm中就叫幽灵依赖

npmrc文件中的 shamefully-hoist = true  就是保持和npm一样  羞耻提升


```
pnpm install typescript esbuild minimist -w -D
```

 "buildOptions":{
  "name":"VUeReactivity",  //打包的名字
  "formats":[   // 打包的格式
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
    "outDir": "dist",  //输出目录
    "sourceMap": true, // 采用sourceMap
    "target": "es2016",  // 目标语法
    "module": "esnext",  // 模块格式
    "moduleResolution": "node", //模块解析方式
    "strict": true, //严格模式
    "resolveJsonModule": true,// 解析json模块
    "esModuleInterop": true, // 允许通过es6语法引入commonjs模块
    "jsx": "preserve", //jsx 不转义
    "lib": ["esnext","dom"], // 支持的类库 esnext及dom        /* Skip type checking all .d.ts files. */
    "baseUrl":".",
    "paths":{   // 所有@vue的引用都去packages/*/src找
      "@vue/*":["packages/*/src"]
    }
  }
}



// 指定打包的模块 和 打包的格式
"dev": "node script/dev.js reactivity -f global" 
