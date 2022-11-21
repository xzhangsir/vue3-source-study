import { shallowReactive } from "@vue/reactivity";


export function initProps(instance,rawProps){
   // instance  组件上定义的props
   // rawProps 用户传入的
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {}
  if(rawProps){
    for(let key in rawProps){
      const val = rawProps[key]
      if(Object.hasOwn(options,key)){
        props[key] = val
      }else{
        attrs[key] = val
      }
    }
  }else{
    for(let key in options){
      attrs[key] = options[key]
    }
  }
  // console.log("props",props)
  // console.log("attrs",attrs)
  // 这里的props 不希望在组件内部被更改 但是props必须是响应式的
   // 因为后续属性变了 需要更新视图 用的应该是 shallowReactive

   instance.props = shallowReactive(props)
   instance.attrs = attrs
}