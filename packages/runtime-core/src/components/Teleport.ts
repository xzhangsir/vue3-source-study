export const TeleportImpl = {
  __isTeleport:true,
  process(oldN,newN,container,anchor,internals){
    let {mountChildren,patchChildren,move} = internals
    
    if(!oldN){
      // 初始化
        const target = document.querySelector(newN.props.to)
        if(target){
          mountChildren(target,newN.children)
        }
    }else{
      // 儿子内容的变化 此时还发生在老容器中
      patchChildren(oldN,newN,container) 
      if(newN.props.to !== oldN.props.to){
        // 说明传送的位置发生变化
        const nextTarget = document.querySelector(newN.props.to)
        
        // 将更新后的孩子 放到新的容器中
        newN.children.forEach(child => move(child,nextTarget));
      }

    }
  }
}

export const isTeleport = (type)=>{
  return type.__isTeleport
}