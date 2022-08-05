import { isVnode } from "../vnode"
import { getCurrentInstance } from "../component"
import { ShapeFlags } from "@vue/shared"
import { onMounted } from "../apiLifecycle"

export const KeepAliveImpl = {
  __isKeepAlive:true,
  setup(props,{slots}){

    const Keys = new Set() //缓存的key
    const cache = new Map() //那个key对应的是那个虚拟节点

    const instance = getCurrentInstance()

    const {createElement,move} = instance.ctx.renderer
    // 先创建一个div  稍后我们要把渲染好的组件移动进去
    const storageContainer  = createElement("div")

    let pendingCacheKey = null;  //稍后需要缓存的key

    onMounted(()=>{
      if(pendingCacheKey){
        // 挂载完毕后 缓存当前实例对应的subTree
        cache.set(pendingCacheKey,instance.subTree) 
      } 
    })

    return ()=>{ //keep-alive 本身没有功能 渲染的是插槽
      // keep-alive 默认会去取slots的default属性 返回的虚拟节点的第一个
      let vnode = slots.default()
      // 看下vnode是不是组件  只有组件可以缓存
      if(!isVnode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)){
        // 必须是虚拟节点 而且是带状态的组件
        return vnode
      }

      const comp = vnode.type
      const key = vnode.key == null ? comp : vnode.key

      let cacheVnode = cache.get(key) //找有没有缓存过
      if(cacheVnode){

      }else{
        Keys.add(key) //缓存Key
        pendingCacheKey = key
      }
      
      return vnode
    }
  }
}

export const isKeepAlive = (vnode)=>{
  return vnode.type.__isKeepAlive
}


