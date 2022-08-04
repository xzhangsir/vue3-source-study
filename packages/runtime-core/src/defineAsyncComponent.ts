import { ref } from "@vue/reactivity"
import { h } from "./h"
import { Fragment} from "./vnode"

export const defineAsyncComponent = (options)=>{
  if(typeof options === 'function'){
    options = {loader:options}
  }
  return {
    setup(){
      const loaded = ref(false)
      const error = ref(false)
      const loading = ref(false)
      const {loader,timeout,errorComponent,delay,LoadingComponent,onError} = options
      if(delay){
        setTimeout(()=>{
            loading.value = true
        },delay)
      }
      let Comp = null;

      function load(){
        return loader().catch(err=>{
          if(onError){
            // 这里实现了一个Promise链的递归
            return new Promise((resolve,reject)=>{
                const retry = ()=>resolve(load())
                const fail = ()=>reject(err)
                onError(err,retry,fail)
            })
          }
        })
      }

      load().then(c=>{
        Comp = c
        loaded.value = true
      }).catch(err=>error.value = err).finally(()=>{
        loading.value = false
      })

      setTimeout(()=>{
        error.value = true
      },timeout)
      return ()=>{
         if(loaded.value){
          return h(Comp)
         }else if(error.value && errorComponent){
          return h(errorComponent,[])
         }else if(loading.value && LoadingComponent){
          return h(LoadingComponent,[])
         }
         return h(Fragment,[])
      }
    }
  }

}