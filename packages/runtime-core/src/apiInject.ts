import { currentInstance } from "./component"

export function provide(key,val){
  if(!currentInstance){
    console.error("provide  必须在setup语法中")
    return 
  }
  let parentProvides = currentInstance.parent && currentInstance.parent.provides;

  let provides = currentInstance.provides
  if(parentProvides === provides){
    provides = currentInstance.provides = Object.create(provides)
  }

  provides[key] = val

}

export function inject(key,defaulVal){
  if(!currentInstance){
    console.error("provide  必须在setup语法中")
    return 
  }

  const provides = currentInstance.parent && currentInstance.parent.provides;
  if(provides && (key in provides)){
    return provides[key]
  }else if(arguments.length > 1){
    return defaulVal
  }
}