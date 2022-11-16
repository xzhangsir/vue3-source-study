export function patchClass(el,nextValue){
  if(nextValue){
     el.className = nextValue
  }else{
   // 如果新的class是空的 就删掉class
    el.removeattribute("class")
  }
}