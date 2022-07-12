export function patchClass(el,nextValue){
  if(nextValue == null){
    // 如果新的class是空的 就删掉class
    el.removeattribute("class")
  }else{
    el.className = nextValue
  }
}