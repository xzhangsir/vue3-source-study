import { reactive } from "@vue/reactivity"
import { invokeArrayFns,isNumber, isString, PatchFlags, ShapeFlags } from "@vue/shared"
import { ReactiveEffect } from "packages/reactivity/src/effect"
import { createComponentInstance, setupComponent } from "./component"
import { hasPropsChanged, updateProps } from "./componentProps"
import { queueJob } from "./scheduler"
import { createVnode, Fragment, isSameVnode,Text } from "./vnode"

export function createRenderer(renderOptions){
  // console.log(renderOptions)
  let {
    // 增加
    insert:hostInsert,
    // 删除
    remove:hostRemove,
    // 修改
    // 修改文本内容
    setElementText:hostSetElementText,
    // 修改文本元素
    setText:hostSetText,
    parentNode:hostParentNode,
    nextSibling:hostNextSibling,
    // 创建
    createElement:hostCreateElement,
    // 创建文本
    createText:hostCreateText,
    // 属性操作
    patchProp:hostPatchProp,
    querySelector

  } = renderOptions

  const normalize = (children,i)=>{
    // 将 字符串文本 转为 （Text,"字符串"）
    if(isString(children[i]) || isNumber(children[i])){
       let vnode = createVnode(Text,null,children[i])
       children[i] = vnode
    }
    return children[i]
  }
  const unmountChildren = (children)=>{
    for(let i = 0 ; i < children.length ; i++){
      unmount(children[i])
    }
  }


  const mountChildren=(el,children,parentComponent)=>{
    for(let i = 0 ; i < children.length;i++){
        //patch(null,children[i],el)
        let child = normalize(children,i)
        patch(null,child,el,parentComponent)
    }
  }

  const mountElement=(vnode,container,anchor,parentComponent)=>{
    let {type,props,children,shapeFlag} = vnode
    // 将创建的真实元素挂载到虚拟节点上，后续方便复用节点和更新
      let el = vnode.el = hostCreateElement(type)
      // console.log("props",props)
      if(props){
        for(let key in props){
          hostPatchProp(el,key,null,props[key])
        }
      }
      if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        // 判断children是不是文本节点
        hostSetElementText(el,children)

      }else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // 判断children是个数组
        mountChildren(el,children,parentComponent)

      }


      // console.log(el)
      // 将创建的元素插入到容器中
      hostInsert(el,container,anchor)

  }
  
  const patchProps = (oldProps,newProps,el)=>{
    // 新的里面有，直接用新的盖掉老的
    for(let key in newProps){
       hostPatchProp(el,key,oldProps[key],newProps[key])
    }
    // 如果老的里面有 新的没有  则是删除
    for(let key in oldProps){
      if(newProps[key] == null){
        hostPatchProp(el,key,oldProps[key],null)
      }
    }
  }

  const patchKeyChildren = (c1,c2,el)=>{
    // 比较两个儿子的差异
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // c1 old  c2 new

    //先处理特殊情况 也就是最简单的

    /**
     * 旧  a   b   c        |  a   b   c
     *                      |
     * 新  a   b   c   d    |  a   b
     * 
     */
    //头头比较
    while(i <= e1 && i <= e2){
      const n1 = c1[i]
      const n2 = c2[i]
      if(isSameVnode(n1,n2)){ //比较两个节点的属性和子节点
        patch(n1,n2,el)  //继续比较儿子
      }else{
        break;
      }
      i++
    }

     /**
     * 旧      a   b   c   |    a   b   c
     *                     |
     * 新  d   a   b   c   |        b   c
     *    
     */
    // 尾尾比较
    while(i <= e1 && i <= e2){
      const n1 = c1[e1]
      const n2 = c2[e2]
      if(isSameVnode(n1,n2)){ //比较两个节点的属性和子节点
        patch(n1,n2,el)  //继续比较儿子
      }else{
        break;
      }
      e1--;
      e2--;
    }
    // common sequence + mount (同序列挂载)
    // i 要比 e1 大 说明有新增的
    // i 和 e2 之间的是需要新增的部分
    if(i > e1){
      // if(i <= e2){
        while(i<=e2){
          const nextPos = e2 + 1
          // 根据下一个人的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el :null
          // console.log(anchor)
          patch(null,c2[i],el,anchor) //创建新增部分的元素
          i++;
        }
      // }
    }else if(i > e2){
        // common sequence + unmount (同序列卸载)
        // i 要比 e2 大 说明有卸载的
        // i 和   e1 之间的是需要卸载的部分
        while(i <= e1){
          unmount(c1[i])
          i++
        }
    }

    // 开始乱序比较
    /**
    * 旧  a   b   c   d   e      f  g
    * 
    * 新  a   b   e   c   d   h  f  g
    * 
    * */
    let s1 = i
    let s2 = i
    // console.log(s1,e1)  // 2 4
    // console.log(s2,e2)  // 2 5
    const keyToNewIndexMap = new Map()

    //  先将新的存起来
    for(let i = s2; i <= e2 ;i++){
        keyToNewIndexMap.set(c2[i].key,i)
    }
    // console.log("keyToNewIndexMap",keyToNewIndexMap)
    // 循环老的元素 看一下新的里面有没有
    // 如果有需要比较差异 没有就删除
    const toBePatched = e2 - s2 + 1; //新的总个数
    // 记录是否比对过的映射表
    const newIndexToOldIndexArr = new Array(toBePatched).fill(0)
    for(let i = s1 ; i <= e1 ;i++){
      const oldChild = c1[i] //老的孩子
      let newIndex = keyToNewIndexMap.get(oldChild.key) //新孩子的索引
      if(newIndex === undefined){
        unmount(oldChild)
      }else{
        // 新的位置  对应的老的位置
        newIndexToOldIndexArr[newIndex - s2] = i + 1;
        patch(oldChild,c2[newIndex],el)
      }
    }
    // console.log("newIndexToOldIndexArr",newIndexToOldIndexArr)
     //  获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexArr)
     // 需要移动位置
    let j = increment.length - 1
    for(let i = toBePatched - 1 ; i >= 0 ; i--){
      let index = i + s2
      let current = c2[index]
      // console.log(current)
      let anchor =  index + 1 < c2.length ? c2[index + 1].el  : null;
      if(newIndexToOldIndexArr[i] === 0){
        // 创建
        patch(null,current,el,anchor)
      }else{
        // 对比过的 直接插入  复用了老节点
       // hostInsert(current.el,el,anchor)
       if(i !== increment[j]){
           // 对比过的 直接插入  复用了老节点
          hostInsert(current.el,el,anchor)
        }else{
          j--
        }
      }
    }
  }
  // 最长递增子序列
  function getSequence(arr){
    /**
     *  2,3,1,5,6,8,7,9,4
     * 
     *  1 3 4 6 7 9
    */
    // 算的是个数  
    // 贪心算法 + 二分查找  
    // 找最有潜力的
    // 2
    // 2 3    2和 1 比 二分 1比2小 所以更有递增的潜力
    // 1 3
    // 1 3 5
    // 1 3 5 6
    // 1 3 5 6 8   8和 7 比 二分 7比8小 所以更有递增的潜力
    // 1 3 5 6 7
    // 1 3 5 6 7 9  5和4比 
    // 1 3 4 6 7 9  
    /**
     * 思路
     * 1:当前这一项比我们最后一项大，则直接放到末尾
     * 2：如果当前这一项比最后一项小，需要在序列通过二分查找到比当前大的这一项，用他来替换掉
     * 3：最优的情况，就是默认递增的
    */
    const len = arr.length

    // 使用标记索引的方式 最终通过最后一项将结果还原
    const p = new Array(len).fill(0) /** */

    const result = [0]
    let start,end,middle;
    let resultLastIndex;
    for(let i = 0 ; i < len ;i++){
      let arrI = arr[i]
      // 序列中的0意味着没有 需要创建
      if(arrI !== 0){
        resultLastIndex = result[result.length - 1]
        //比较最后一项和当前项的值 
        //如果比最后一项大 则将当前索引放到结果集中
        if(arr[resultLastIndex] < arrI){
          result.push(i)

          // 当前放在末尾的要记住他前面的那节点是谁
          p[i] = resultLastIndex /** */
          continue
        }
        // 这里我们需要通过二分查找，在结果集中找到比当前值最大的，用当前值的索引将其替换掉

        // 递增序列  采用二分查找 
        start = 0;
        end = result.length - 1;

        while(start < end){
          middle = ((start + end) / 2) | 0
          if(arr[result[middle]] < arrI){
            start = middle + 1
          }else{
            end = middle
          }
        }
        // 找到需要替换的  用更有递增潜力的直接替换调
        if(arr[result[end]] > arrI){
          result[end] = i
          p[i] = result[end - 1]
        }
      }
    }
    // console.log(p)
    // 通过最后一项进行回溯
    ;let i = result.length
    let last = result[i - 1]
    while(i-- > 0){
      result[i] = last
      last = p[last]
    }
    return result
  }

  const patchChildren = (oldN,newN,el,parentComponent)=>{
    // 比较两个虚拟节点的儿子的差异
    // el就是当前的父节点
    const c1 = oldN && oldN.children
    const c2 = newN && newN.children

    // 获取之前和当前需要更新的节点 shapeFlag
    const prevShapeFlag = oldN.shapeFlag
    const activeShapeFlag = newN.shapeFlag

    // 儿子可能是  文本 空的null 或者 数组
    // 比较两个儿子列表的差异
    /**
     * 
     * -  新儿子    旧儿子    操作方式
     *  
     *    文本      数组      删除旧儿子，设置文本内容
     *    文本      文本      更新文本即可
     *    文本       空       同上（更新文本即可）
     * 
     *    数组       数组      diff算法
     *    数组       文本      清空文本 ，进行挂载
     *    数组        空        直接进行挂载
     * 
     *    空        数组        删除所有儿子
     *    空        文本        清空文本
     *    空        空          不处理
    */
    if(activeShapeFlag & ShapeFlags.TEXT_CHILDREN){
      // 现在变 文本
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // 如果原来的是数组  先删除所有的子节点
        unmountChildren(c1)
      }
      if(c1 !== c2){
        hostSetElementText(el,c2)
      }
    }else if(activeShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      // 现在变数组
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // diff算法 之前是数组
        patchKeyChildren(c1,c2,el)  //全量比对

      }else if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
        // 之前是文本
        // 先清空文本
         hostSetElementText(el,"")
         mountChildren(el,c2,parentComponent)
      }
    }else{
       // 现在变空 
      hostSetElementText(el,"")
    }
  }

  const patchBlockChildren = (oldN,newN,parentComponent)=>{
    for(let i = 0 ; i < newN.dynamicChildren.length ;i++){
      patchElement(oldN.dynamicChildren[i],newN.dynamicChildren[i],parentComponent)
    }
  }

  const patchElement = (oldN,newN,parentComponent)=>{
    let el = newN.el = oldN.el
    
    let oldProps = oldN.props || {}
    let newProps = newN.props || {}
    // 先比较属性  

    // 属性的靶向更新
    let {patchFlag} = newN
    if(patchFlag & PatchFlags.CLASS){
      if(oldProps.class !== newProps.class){
        hostPatchProp(el,'class',null,newProps.class)
      }
      // style ... 事件等
    }else{
      patchProps(oldProps,newProps,el)
    }

    
    // 再比较儿子
    // 元素的靶向更新
    if(newN.dynamicChildren){
      patchBlockChildren(oldN,newN,parentComponent)
    }else{
      for(let i = 0 ; i < newN.children.length ;i++){
        newN.children[i] = normalize(newN.children,i)
      }
      patchChildren(oldN,newN,el,parentComponent)
    }
    
  }

  const processText = (oldN,newN,container)=>{
    if(oldN === null){
      // 文本初次渲染
      hostInsert((newN.el = hostCreateText(newN.children)),container)
    }else{
      // 文本更新 节点复用 只改文本
      const el = newN.el = oldN.el
      if(newN.children !== oldN.children){
        hostSetText(el,newN.children)
      }
    }
  }

  const processFragment = (oldN,newN,container,parentComponent)=>{
    if(oldN == null){
      mountChildren(container,newN.children,parentComponent)
    }else{
      patchChildren(oldN,newN,container,parentComponent)
    }
  }

  const processElement = (oldN,newN,container,anchor,parentComponent)=>{
    if(oldN === null){
       // 初次渲染（包括元素的初次渲染和组件的初次渲染）
      mountElement(newN,container,anchor,parentComponent)
    }else{
      // 更新流程
      /**
       * - 如果前后完全没有关系，删除老的，添加新的
       * - 老的和新的一样 复用 ，属性可能不一样 再对比属性，更新属性
       * - 比儿子
      */
      patchElement(oldN,newN,parentComponent)
    }
  }

  const mountComponent = (vnode,container,anchor,parentComponent)=>{
    // 1 ) 要创造一个组件的实例
    let instance =  vnode.component = createComponentInstance(vnode,parentComponent)
    // 2 ) 给实例上赋值
    setupComponent(instance)
    // 3 ） 创造一个effect
    setupRenderEffect(instance,container,anchor)

  }

  const  updateComponentPreRender = (instance,next)=>{
    instance.next = null
    instance.vnode = next //实例上最新的虚拟节点
    updateProps(instance.props,next.props)
  }


  const setupRenderEffect = (instance,container,anchor)=>{
    const {render} = instance
    const componentUpdateFn = ()=>{
      // 区分是初始化 还是要更新
      if(!instance.isMounted){ 
        let {bm,m} = instance
        if(bm){
          invokeArrayFns(bm)
        }
        //初始化
        const subTree = render.call(instance.proxy,instance.proxy)
        // 创造了subtree的真实节点 并插入了
        patch(null,subTree,container,anchor,instance)
        if(m){
          invokeArrayFns(m)
        }

        instance.subTree = subTree

        instance.isMounted = true
      }else{
        // 组件内部更新
        let {next,bu,u} = instance
        if(next){
          // 更新前需要拿到最新的属性来进行更新
          updateComponentPreRender(instance,next)
        }
        if(bu){
          invokeArrayFns(bu)
        }
        const subTree = render.call(instance.proxy,instance.proxy)
        patch(instance.subTree,subTree,container,anchor,instance)
        instance.subTree = subTree
        if(u){
          invokeArrayFns(u)
        }
      }
    }
     // ()=>queueJob(instance.update)  组件的异步更新
    const effect = new ReactiveEffect(componentUpdateFn,()=>queueJob(instance.update))
    // 将组件强制更新逻辑 保存到组件的实例上
    let update = instance.update = effect.run.bind(effect)  //  调用这个方法 可以让组件强制重新渲染
    update()
  }
  
  const shouldUpdateComponent=(n1,n2)=>{
    const {props:prevProps,children:prevChildren} = n1
    const {props:nextProps,children:nextChildren} = n2

    if(prevProps === nextProps) return false

    if(prevChildren || nextChildren){
      return true
    }

    return hasPropsChanged(prevProps,nextProps)
  }

  const updateComponent = (n1,n2)=>{
    // 对于元素而已 复用的是dom节点 对于组件复用的是实例
    const instance = (n2.component = n1.component)
     // 组件需要更新 只需要调用实例的update
    if(shouldUpdateComponent(n1,n2)){
      instance.next = n2
      instance.update()
    }
  }

  const processComponent = (oldN,newN,container,anchor,parentComponent)=>{
    if(oldN  == null){
      mountComponent(newN,container,anchor,parentComponent)
    }else{
      // 组件更新靠的是props
      updateComponent(oldN,newN)
    }
  }

  const patch = (oldN,newN,container,anchor = null,parentComponent = null) =>{
    if(oldN === newN) return null
    // 新老节点 完全不一致  直接删除老的 再创建新的
    if(oldN && !isSameVnode(oldN,newN)){
      unmount(oldN)
      oldN = null
    }

    const {type,shapeFlag} = newN

    switch(type){
      case Text:
          processText(oldN,newN,container)
        break;
      case Fragment:
          processFragment(oldN,newN,container,parentComponent)
         break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(oldN,newN,container,anchor,parentComponent)
        }else if(shapeFlag & ShapeFlags.COMPONENT){
          processComponent(oldN,newN,container,anchor,parentComponent)
        }
    }
  }

  const unmount = (vnode)=>{
    hostRemove(vnode.el)
  }

  // 渲染过程是通过传入的 renderOptions 来渲染的
  const render = (vnode,container)=>{
    if(vnode == null){
      // 卸载
      //如果vnode是空的 就清空container里面的内容 
      if(container._vnode){
        unmount(container._vnode)
      }
    }else{
       // 挂载
      // 既有初始化的逻辑 又有更新的逻辑
      
      patch(container._vnode || null,vnode,container)
    }

    //将上一个的虚拟节点缓存起来
    container._vnode = vnode

  }
  return {
    render
  }
}