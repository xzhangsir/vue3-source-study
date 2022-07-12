export function patchStyle(el,prevValue,nextValue){
  // 样式需要比对 prevValue和nextValue的差异


  for(let key in nextValue){
    // 用新的直接覆盖
    el.style[key] = nextValue[key]
  }

  
  // 如果旧的是 color:red;fontSize:20px
  // 新的是 color：blue
  // 那么就需要将旧的fontSize删除
  if(prevValue){
    for(let key in prevValue){
      if(nextValue[key] == null){
        el.style[key] = null
      }
    }
  }




}