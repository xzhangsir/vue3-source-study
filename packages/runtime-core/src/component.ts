import { proxyRefs, reactive } from "@vue/reactivity"
import { isFunction, isObject, ShapeFlags } from "@vue/shared"
import { initProps } from "./componentProps"

export function createComponentInstance(vnode){
  const instance = {
      data:null,
      vnode, // //组件的虚拟节点
      subTree:null,// 渲染的节点
      isMounted:false, //组件是否挂载
      update:null,
      propsOptions:vnode.type.props,
      props:{},
      attrs:{},
      proxy:null,
      render:null,
      setupState:{},
      slots:{}
  }
  return instance
}
const publicPropertyMap = {
  $attrs:(i)=>i.attrs,
  $slots:(i)=>i.slots
}
function initSlots(instance,children){
  if(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN){
    instance.slots = children
  }
}
export function setupComponent(instance){
  let {props,type,children} = instance.vnode
  initProps(instance,props)
  initSlots(instance,children)
  instance.proxy = new Proxy(instance,{
    get(target,key){
      const {data,props,setupState} = target
      if(data && Object.hasOwn(data,key)){
        return data[key]
      }else if(props && Object.hasOwn(setupState,key)){
        return setupState[key]
      }else if(props && Object.hasOwn(props,key)){
        return props[key]
      }

      let getter = publicPropertyMap[key] //this.$attrs

      if(getter){
        return getter(target)
      }
    },
    set(target,key,val){
      // 先data 再setup 最后props
      const {data,props,setupState} = target
      if(data && Object.hasOwn(data,key)){
        data[key] = val
        return true
      }else if(data && Object.hasOwn(setupState,key)){
        setupState[key] = val
        return true
      }else if(props && Object.hasOwn(props,key)){
        //用户操作的属性是代理对象 这里屏蔽了
        // 但我们可以通过instance.props 拿到真实的props
        console.warn("组件内不能修改组件的props" + (key as string));
        return false
      }

      return true

    }
  })

  let data = type.data

  if(data){
      if(!isFunction(data)){
       return  console.warn("data必须是function");
      }

      instance.data = reactive(data.call(instance.proxy))
  }

  let setup = type.setup
  if(setup){
    const setupContext = {
      emit:(event,...args)=>{
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`
        const handler = instance.vnode.props[eventName]
        handler && handler(...args)
      },
      attrs:instance.attrs,
      slots:instance.slots
    }
    const setupResult = setup(instance.props,setupContext)
    
    if(isFunction(setupResult)){
      // 如果是函数 setup 返回的是render函数
      instance.render = setupResult
    }else if(isObject(setupResult)){
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if(!instance.render){
    instance.render = type.render
  }

}