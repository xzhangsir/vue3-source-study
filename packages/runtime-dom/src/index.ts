import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";


const renderOptions =  Object.assign(nodeOps,{patchProp})

// console.log(renderOptions)

// container  虚拟dom挂载到哪个容器上
export function render(vnode,container){
  createRenderer(renderOptions).render(vnode,container)
}


export * from  "@vue/runtime-core"
