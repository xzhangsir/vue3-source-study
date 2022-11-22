import { currentInstance, setCurrentInstance } from "./component"

export const enum Lifecycle{
  BEFORE_MOUNT = 'bm',
  MOUNTED='m',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}

function createHook(type){
  return (hook,target = currentInstance)=>{
    if(target){
      const hooks = target[type] || (target[type] = [])
      const wrappedHook = ()=>{
        setCurrentInstance(target)
        hook()
        setCurrentInstance(null)
      }
      hooks.push(wrappedHook)
      // console.log(hooks)
    }

  }
}


// 工厂模式
export const onBeforeMount = createHook(Lifecycle.BEFORE_MOUNT)
export const onMounted = createHook(Lifecycle.MOUNTED)
export const onBeforeUpdate = createHook(Lifecycle.BEFORE_UPDATE)
export const onUpdated = createHook(Lifecycle.UPDATED)