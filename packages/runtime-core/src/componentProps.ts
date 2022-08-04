import { reactive } from "@vue/reactivity";
import { hasOwn, ShapeFlags } from "@vue/shared";

export function initProps(instance,rawProps){
  // instance  组件上定义的props
  // rawProps 用户传入的

  const props = {};
  const attrs = {};


  const options = instance.propsOptions || {}

  if(rawProps){
    for(let key in rawProps){
      const val = rawProps[key]
      if(hasOwn(options,key)){
        props[key] = val
      }else{
        attrs[key] = val
      }
    }
  }
  // console.log(props)
  // console.log(attrs)

  // 这里的props 不希望在组件内部被更改 但是props必须是响应式的
  // 因为后续属性变了 需要更新视图 用的应该是 shallowReactive
  instance.props = reactive(props)
  instance.attrs = attrs


  // props是组件中的  如果是函数式组件 应该用attrs作为props
  if(instance.vnode.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT){
    instance.props = instance.attrs
  }

}

export const hasPropsChanged = (prevProps = {},nextProps = {})=>{
  const nextKeys = Object.keys(nextProps)
  // 比对属性前后 个数是否一致  不一致就需要更新
  if(nextKeys.length !==  Object.keys(prevProps).length){
    return true
  }
  // 再比对属性前后的值 是否一致 不一致也要更新
  for(let i = 0 ; i < nextKeys.length ;i++){
    const key = nextKeys[i]
    if(nextProps[key] !== prevProps[key]){
      return true
    }
  }
  return  false
}


/* export function updateProps(instance,prevProps,nextProps){
  //看下属性有没有变化

  // 属性的个数  属性的值 是否发生变化
  if(hasPropsChanged(prevProps,nextProps)){
    for(const key in nextProps){
      instance.props[key] = nextProps[key]
    }
  //  以前有的 现在没有了 删掉以前的
    for(const key in instance.props){
      if(!hasOwn(nextProps,key)){
        delete instance.props[key]
      }
    }
  }
} */

export function updateProps(prevProps,nextProps){
    for(const key in nextProps){
      prevProps[key] = nextProps[key]
    }
    
    for(const key in prevProps){
      if(!hasOwn(nextProps,key)){
        delete prevProps[key]
      }
    }
}