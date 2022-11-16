function createInvoker(callback){
  const invoker = (e)=>invoker.value(e)
  invoker.value = callback
  return invoker
}


export function patchEvent(el,eventName,nextValue){

  // 事件绑定都缓存到了 当前的dom身上
  let invokers = el._vei || (el._vei = {})

  let exits = invokers[eventName]
  // 查看事件是否缓存过 并且 nextValue 要有值
  if(exits && nextValue){
    // 没有卸载函数 只是改了invoker的value属性
    exits.value = nextValue 

  }else{
    // 不存在就创建事件

    // 先将 onClick 转为 click
    let event = eventName.slice(2).toLowerCase()

    // 将事件缓存起来
    if(nextValue){
      const invoker = invokers[eventName] = createInvoker(nextValue)
      el.addEventListener(event,invoker)
    }else if(exits){
      // 之前有值 现在nextValue为空 就移除这个事件
      el.removeEventListener(event,exits)
      invokers[eventName] = null
    }


  }

}