const { resolve } = require('path') // node中的内置模块
const minimist = require('minimist') //解析命令行参数
const { build } = require('esbuild')
// node script/dev.js  reactivity -f global
const args = minimist(process.argv.slice(2))
//console.log(args)
//{ _: [ 'reactivity' ], f: 'global' }
const target = args._[0] || 'reactivity'
const format = args.f || 'global'
//通过绝对路径去引文件
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

//输出文件的格式
const outputFormat = {
  global: 'iife', //   iife  立即执行函数 (function(){})()
  cjs: 'cjs', // node中的模块 module.exports
  'esm-bundler': 'esm' // 浏览器中的esModule模块  import
}[format]
// 输出文件的位置
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, //把所有的包全部打包到一起
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {
    //监控文件变化
    onRebuild(err) {
      if (!err) console.log('rebuilt~~~~~')
    }
  }
}).then(() => {
  console.log('watching~~~~')
})
