import { ReactiveEffect } from "@vue/reactivity"
import { isNumber, isString, ShapeFlags } from "@vue/shared"
import { createComponentInstance, setupComponent } from "./component"
import {queueJob} from './scheduler'
import { createVnode,Text,isSameVnode, Fragment } from "./vnode"

export function createRenderer(renderOptions){

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
  patchProp:hostPatchProp

} = renderOptions


  const normalize = (children,i)=>{
    // 将 字符串文本 转为 （Text,"字符串"）
    if(isString(children[i]) || isNumber(children[i])){
       let vnode =  createVnode(Text,null,children[i])
       children[i] = vnode
    }
    return children[i] 
  }

  const mountChildren = (el,children)=>{
    for(let i = 0 ; i < children.length;i++){
      let child = normalize(children,i)
      patch(null,child,el)
    }
  }


  const mountElement = (vnode,container,anchor)=>{
    let {type,props,children,shapeFlag} = vnode
    // 将创建的真实元素挂载到虚拟节点上，后续方便复用节点和更新
    let el = vnode.el = hostCreateElement(type)

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
      mountChildren(el,children)

    }


    // 将创建的元素插入到容器中
    hostInsert(el,container,anchor)


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

  const patchProps = (oldProps,newProps,el) => {
    // 新的里面有，直接用新的盖掉老的
    for(let key in newProps){
      hostPatchProp(el,key,oldProps[key],newProps[key])
    }
    // 如果老的里面有 新的没有  则是删除
    for(let key in oldProps){
      if(newProps[key] == null){
        hostPatchProp(el,key,oldProps[key],undefined)
      }
    }

  }


  const unmountChildren = (children)=>{
    for(let i = 0 ; i < children.length ; i++){
      unmount(children[i])
    }
  }

  const patchKeyChildren = (c1,c2,el)=>{
    // 比较两个儿子的差异
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
  
    //先处理特殊情况 也就是最简单的

    /**
     * 旧  a   b   c        |  a   b   c
     *                      |
     * 新  a   b   c   d    |  a   b
     * 
     */

    // sync from start

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
     *     i     
     * 
     * 计算之后  i == 0 e1 == -1 e2 == 0
     */

      // sync from end

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
      // i 和   e2 之间的是需要新增的部分

      if(i > e1){
        if(i <= e2){
          while(i <= e2){
            const nextPos = e2 + 1;
            // 根据下一个人的索引来看参照物
            const anchor = nextPos < c2.length ? c2[nextPos].el : null
            patch(null,c2[i],el,anchor) //创建新增部分的元素
            i++;
          }
        }
      }else if( i > e2){
         // common sequence + unmount (同序列卸载)
        // i 要比 e2 大 说明有卸载的
        // i 和   e1 之间的是需要卸载的部分

        /**
         * 旧  a   b   c 
         * 
         * 新      b   c
         * 
         * */
        if(i <= e1){
            while(i <= e1){
              unmount(c1[i])
              i++
            }
        }
      }

      // 特殊的处理完毕 ··
      // 开始乱序比较

        /**
         * 旧  a   b   c   d   e      f  g
         * 
         * 新  a   b   e   c   d   h  f  g
         * 
         * */


     let s1 = i
     let s2 = i
     const keyToNewIndexMap = new Map()

    //  先将新的存起来
     for(let i = s2; i <= e2 ;i++){
      
        keyToNewIndexMap.set(c2[i].key,i)

     }
    //  console.log(keyToNewIndexMap);
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

     //  获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexArr)

    // 需要移动位置
    let j = increment.length - 1
    for(let i = toBePatched - 1 ; i >= 0 ; i--){
      let index = i + s2
      let current = c2[index]
      let anchor =  index + 1 < c2.length ? c2[index + 1].el  : null;
      if(newIndexToOldIndexArr[i] === 0){
        // 创建
        patch(null,current,el,anchor)
      }else{
        if(i !== increment[j]){
           // 对比过的 直接插入  复用了老节点
          hostInsert(current.el,el,anchor)
        }else{
          j--
        }
      }
    } 



     






  }

  
  //最长递增子序列
  /**
   * [5,3,4,0]
   *  所以 3和4不用动 只要动5就行
   * 
  */

  /**
   *  3 2 8 9 5 6 7 11 15
   * 
   * - 2 8 9 11 15
   * - 2 5 6 7 11 15  这个是最长递增子序列  
   * 
  */
  // 算的是个数  
  // 贪心算法 + 二分查找  
  // 找最有潜力的
  // 3
  // 2
  // 2 8
  // 2 8 9  和 5 比 二分
  // 2 5 9  和 6 比 二分
  // 2 5 6  
  // 2 5 6 7
  // 2 5 6 11
  // 2 5 6 11 15

  /**
   * 思路
   * 1:当前这一项比我们最后一项大，则直接放到末尾
   * 2：如果当前这一项比最后一项小，需要在序列通过二分查找到比当前大的这一项，用他来替换掉
   * 3：最优的情况，就是默认递增的
  */

  function getSequence(arr){
    const len = arr.length

    // 使用标记索引的方式 最终通过最后一项将结果还原
    const p = new Array(len).fill(0) /** */

    const result = [0]

    let start,end,middle;
    let resultLastIndex;

    for(let i = 0 ; i < len ; i++){
      let arrI = arr[i]
      if(arrI !== 0){
        resultLastIndex = result[result.length - 1]
        // 比较最后一项和当前项的值
        // 如果当前的比最后一项大 则将当前索引加入
        if(arr[resultLastIndex] < arrI){
          result.push(i)

          // 当前放在末尾的要记住他前面的那个人是谁
          p[i] = resultLastIndex /** */
          continue
        }
        // 这里我们需要通过二分查找，在结果集中找到比当前值最大的，用当前值的索引将其替换掉

        // 递增序列  采用二分查找 
        start = 0 ; 
        end = result.length - 1;

        while(start < end){
          middle = ((start + end)/2)|0

          if(arr[result[middle]] < arrI){
            start = middle + 1
          }else{
            end = middle
          }
        }

        // 找到需要替换的  直接替换
        // 用当前这一项 替换掉已有的 比当前大的哪一项。
        // 找更有潜力的
        if(arr[result[end]] > arrI){
          result[end] = i
          p[i] = result[end - 1] /** */
        }
      }
    }

  // 通过最后一项进行回溯
    ;let i = result.length
    let last = result[i - 1]
    while(i-- > 0){
      result[i] = last
      last = p[last]
    }


    return result
  }





  const patchChildren = (oldN,newN,el)=>{
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
         mountChildren(el,c2)
      }
   }else{
    // 现在变空 
      hostSetElementText(el,"")
   }





  }

  const patchElement = (oldN,newN)=>{
    let el = newN.el = oldN.el

    let oldProps = oldN.props || {}
    let newProps = newN.props || {}
    // 先比较属性  
    patchProps(oldProps,newProps,el)
    // 再比较儿子
    patchChildren(oldN,newN,el)

  }

  const processElement = (oldN,newN,container,anchor)=>{
    if(oldN === null){
      // 初次渲染（包括元素的初次渲染和组件的初次渲染）
      mountElement(newN,container,anchor)
    }else{
      // 更新流程
      /**
       * - 如果前后完全没有关系，删除老的，添加新的
       * - 老的和新的一样 复用 ，属性可能不一样 再对比属性，更新属性
       * - 比儿子
      */
      patchElement(oldN,newN)
    }
  }

  const processFragment = (oldN,newN,container)=>{
    if(oldN == null){
      mountChildren(container,newN.children)
    }else{
      patchChildren(oldN,newN,container)
    }
  }

  

  const mountComponent = (vnode,container,anchor)=>{
    // 1 ) 要创造一个组价的实例
    let instance =  vnode.component = createComponentInstance(vnode)

    // 2 ) 给实例上赋值
    setupComponent(instance)

    // 3 ） 创造一个effect

    setupRenderEffect(instance,container,anchor)



  }

  const setupRenderEffect = (instance,container,anchor)=>{
    const {render} = instance
    const componentUpdateFn = ()=>{
      // 区分是初始化 还是要更新
      if(!instance.isMounted){ //初始化

        // const subTree = render.call(state)
        const subTree = render.call(instance.proxy)

        // 创造了subtree的真实节点 并插入了
        patch(null,subTree,container,anchor)

        instance.subTree = subTree

        instance.isMounted = true
      }else{
        // 组件内部更新
        // const subTree = render.call(state)
        const subTree = render.call(instance.proxy)
        patch(instance.subTree,subTree,container,anchor)
        instance.subTree = subTree

      }
    }

    // ()=>queueJob(instance.update)  组件的异步更新
    const effect = new ReactiveEffect(componentUpdateFn,()=>queueJob(instance.update))

    // 将组件强制更新逻辑 保存到组件的实例上
    let update = instance.update = effect.run.bind(effect)  //  调用这个方法 可以让组件强制重新渲染
    update()
  }

  const processComponent = (oldN,newN,container,anchor)=>{
    // 有普通组件和函数式组件 V3不建议使用函数式组件
    if(oldN === null){
      mountComponent(newN,container,anchor)
    }else{
      // 组件更新靠的是props
    }

  }



  // 核心的方法 参数：老节点 新节点 挂载的容器
  const patch = (oldN,newN,container,anchor = null)=>{
    if(oldN === newN) return null

    // 新老节点完全不一致 直接删除老的 再 创建新的
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
          processFragment(oldN,newN,container)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(oldN,newN,container,anchor)
        }else if(shapeFlag & ShapeFlags.COMPONENT){
          processComponent(oldN,newN,container,anchor)
        }
    }
  }

  const unmount = (vnode)=>{
    hostRemove(vnode.el)
  }

  // 渲染过程是通过传入的 renderOptions 来渲染的
  const render = (vnode,container)=>{
    // console.log(vnode,container)
    
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
// 文本的处理，需要自己增加类型（Text） 
// 因为不能通过document.createElement("文本")创建文本节点
