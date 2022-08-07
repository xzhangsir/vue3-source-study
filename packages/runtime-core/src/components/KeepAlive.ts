import { isVnode } from "../vnode"
import { getCurrentInstance } from "../component"
import { ShapeFlags } from "@vue/shared"
import { onMounted, onUpdated } from "../apiLifecycle"


function resetShapeFlag(vnode){
  let shapeFlag = vnode.shapeFlag
  if(shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE){
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
  }
  if(shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE){
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
  }
  vnode.shapeFlag = shapeFlag
}

export const KeepAliveImpl = {
  __isKeepAlive:true,
  props:{
    include:{}, //要缓存的
    exclude:{}, //不要缓存的
    max:{} //最大缓存的个数  LRU  最近最旧未使用法
  },
  setup(props,{slots}){

    const Keys = new Set() //缓存的key
    const cache = new Map() //那个key对应的是那个虚拟节点

    const instance = getCurrentInstance()

    const {createElement,move} = instance.ctx.renderer
    // 先创建一个div  稍后我们要把渲染好的组件移动进去
    const storageContainer  = createElement("div")


    instance.ctx.deactivate = function(vnode){
      move(vnode,storageContainer)
    }
     instance.ctx.active = function(vnode,container,anchor){


      move(vnode,container,anchor)
    }

    let pendingCacheKey = null;  //稍后需要缓存的key

    // 缓存组件的虚拟节点
    function cacheSubTree(){
      if(pendingCacheKey){
        // 挂载完毕后 缓存当前实例对应的subTree
        cache.set(pendingCacheKey,instance.subTree) 
      } 
    }
    onMounted(cacheSubTree)
    onUpdated(cacheSubTree)
    const {include,exclude,max} = props


    let currentVNode = null

    function pruneCacheEntry(key){
      resetShapeFlag(currentVNode)
      cache.delete(key)
      Keys.delete(key)
    }

 

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

      let name = comp.name // 组件的名字 更具名字来判断是否需要缓存

      if(name && (include && !include.split(',').includes(name)) || (exclude && exclude.split(',').includes(name)) ){
        return vnode;
      }

      let cacheVnode = cache.get(key) //找有没有缓存过
      if(cacheVnode){
        vnode.component = cacheVnode.component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        Keys.delete(key)
        Keys.add(key)
      }else{
        Keys.add(key) //缓存Key
        pendingCacheKey = key
        if(max && max < Keys.size){
          pruneCacheEntry(Keys.values().next().value)
        }
      }
      // 标识这个组件 的卸载是假的卸载
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      currentVNode = vnode
      
      return vnode
    }
  }
}

export const isKeepAlive = (vnode)=>{
  return vnode.type.__isKeepAlive
}


