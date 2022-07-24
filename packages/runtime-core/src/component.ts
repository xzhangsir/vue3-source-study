import { proxyRefs, reactive } from "@vue/reactivity"
import { hasOwn, isFunction, isObject } from "@vue/shared"
import { initProps } from "./componentProps"

export function createComponentInstance(vnode){
  // 组件的实例
  const instance = {
    data:null,
    vnode, //v2中组件的虚拟节点叫$vnode 渲染的内容叫 _vnode
    subTree:null, //V3中组件的虚拟节点叫vnode 渲染的节点叫subTree
    isMounted:false,   //组件是否挂载
    update:null,
    propsOptions:vnode.type.props,
    props:{},
    attrs:{},
    proxy:null,
    render:null,
    setupState:{}
  }
  
  return instance
}

const publicPropertyMap = {
  $attrs:(i)=>i.attrs
}

export function setupComponent(instance){
  let {props,type} = instance.vnode
  initProps(instance,props)

  instance.proxy = new Proxy(instance,{
    get(target,key){
      const {data,props,setupState} = target
      if(data && hasOwn(data,key)){
        return data[key]
      }else if(props && hasOwn(setupState,key)){
        return setupState[key]
      }else if(props && hasOwn(props,key)){
        return props[key]
      }

      let getter = publicPropertyMap[key] //this.$attrs
      
      if(getter){
        return getter(target)
      }
    },
    set(target,key,val){
      const {data,props,setupState} = target
      if(data && hasOwn(data,key)){
        data[key] = val
        return true
      }else if(data && hasOwn(setupState,key)){
        setupState[key] = val
        return true
      }else if(props && hasOwn(props,key)){
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
  console.log(type);
  

  if(setup){
    const setupContext = {}
    const setupResult = setup(instance.props,setupContext)

    if(isFunction(setupResult)){
      // setup 返回的是render
      instance.render = setupResult
    }else if(isObject(setupResult)){
      // 模板中的ref就不用去.value了
      instance.setupState = proxyRefs(setupResult)
    }
    
  }

  if(!instance.render){
    instance.render = type.render
  }



}
