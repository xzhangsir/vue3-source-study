
import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";


// DOM和属性的API

const renderOptions =  Object.assign(nodeOps,{patchProp})


// container  虚拟dom挂载到哪个容器上
export function render(vnode,container){
  createRenderer(renderOptions).render(vnode,container)
  
}



export * from  "@vue/runtime-core"
// console.log(renderOptions)
