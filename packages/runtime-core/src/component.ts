import { reactive } from "@vue/reactivity"
import { isFunction } from "@vue/shared"
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
      render:null
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
      const {data,props} = target
      if(data && Object.hasOwn(data,key)){
        return data[key]
      }else if(props && Object.hasOwn(props,key)){
        return props[key]
      }

      let getter = publicPropertyMap[key] //this.$attrs

      if(getter){
        return getter(target)
      }
    },
    set(target,key,val){
      const {data,props} = target
      if(data && Object.hasOwn(data,key)){
        data[key] = val
        return true
      //用户操作的属性是代理对象 这里屏蔽了
      // 但我们可以通过instance.props 拿到真实的props
      }else if(props && Object.hasOwn(props,key)){
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

  instance.render = type.render

}