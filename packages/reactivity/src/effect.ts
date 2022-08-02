import { recordEffectScope } from "./effectScope"

export let activeEffect = undefined //当前正在执行的effect是谁

function cleanupEffect(effect){
  const {deps} = effect //deps里面装的是name对应的effect
  for(let i = 0 ; i < deps.length ;i++){
    deps[i].delete(effect) //解除effect
  }
  effect.deps.length = 0
}


export class ReactiveEffect{
  //这个TS中写class的方式
  // 用于标记当前effect的父级是谁
  public parent = null
  // 反向记录 effect 依赖了那些属性
  public deps = []
  //在实例上新增一个active属性
  public active = true // 这个effect默认是激活的状态
  //用户传递的参数也会在当前this上  类似 this.fn = fn
  // scheduler  用户自定义调度器
  constructor(public fn,public scheduler?){
    recordEffectScope(this)
  }
  // run  就是执行effect
  run(){
    // 如果当前的effect是非激活的状态
    // 只执行传入的函数  不需要进行依赖收集
    if(!this.active){
      this.fn()
    }

    // 开始进行依赖收集
    // 核心是：将当前的effect和稍后渲染的属性关联在一起
    try{
      // 记录当前effect的父级是谁
      this.parent = activeEffect
      activeEffect = this

      // 在执行用户函数之前将之前收集的内容清空
      cleanupEffect(this)
      // 当fn()中调佣取值操作的时候 就可以获取到这个全局的activeEffect
      return this.fn()
    }finally{
      // 结束后 清空activeEffect
      // activeEffect = undefined
      // 结束后指向父级
      activeEffect = this.parent
      this.parent = null  // 不清空也行 初始化时也清空了
    }
    
  }  
  stop(){
    if(this.active){
      this.active = false
      cleanupEffect(this) //停止effect收集
    }
  }
}

export function effect(fn,options:any = {}){
  // 这里的fn可以根据状态变化 重新执行，且effect可以嵌套着写
  //创建响应式的effect
  const _effect = new ReactiveEffect(fn,options.scheduler)
  // 默认执行一次
  _effect.run()


  const runner = _effect.run.bind(_effect)
  runner.effect = _effect //将effect挂载到runner函数上

  return runner
}



// 3.0最早关于这个的处理是采用栈
// 先让e1入栈 再让e2入栈 随后依次出栈
/**
effect(()=>{ //e1
  state.name  // name -> e1
  effect(()=>{ //e2
    state.age // age -> e2
  })
  state.address // address -> e1
})
*/

// 3.0最新版 做了类似树形结构的处理 找effect的父级
/**
effect(()=>{ //e1  parent = null activeEffect = e1
  state.name  // name -> e1
  effect(()=>{ //e2  parent = e1  activeEffect = e2
    state.age // age -> e2
  })
  state.address //  activeEffect = this.parent 又指向了e1
})
*/


const targetMap = new WeakMap()
//收集依赖
export function track(target,type,key){
  // console.log(target,type,key)
  //只有对effect中的属性变化 才进行收集
  if(!activeEffect) return
  // console.log(target,type,key)

  // 构造下面结构的数据
  /**
    WeakMap = {
      对象：new Map({
        key(name/age):Set(effect)
      })
    }
  */

 let depsMap = targetMap.get(target)
//  第一次获取肯定没有
 if(!depsMap){
  targetMap.set(target,(depsMap = new Map()))
 }
 let dep = depsMap.get(key)
 //  第一次获取肯定没有
 if(!dep){
   depsMap.set(key,(dep = new Set()))
 }
 /**
  * effect(()=>{
  *   state.name
  *   state.name
  *   state.name
  * })
 */
// 上述情况下 name只需要收集一次就好
  if(!dep.has(activeEffect)){
    dep.add(activeEffect)

  // 至此 上述代码 只做了单向的记录 
  // 属性记录了effect  但是如果effect删除了 这个属性任然还记录这个effect
  // 我们需要再进行下 反向记录 
  // 让effect 也记录下属性、
  // 这样做的好处是 可以清理
    //让effect记录自己关联了那些属性
    activeEffect.deps.push(dep)
  }
  // console.log(targetMap);
  // console.log(activeEffect)

}

//触发更新
export function trigger(target,type,key,value,oldVal){
  const depsMap = targetMap.get(target)
  if(!depsMap) return  //触发的值不在依赖中 则不更新
  let effects = depsMap.get(key) // 找到属性对应的effect
  
  if(effects){
   /*  effects = new Set(effects) // 先copy一份
    effects.forEach(effect=>{
      // 如果在执行effect的时候 effect里面又有数据更新
      // 那么我们就不能执行effect 防止死循环
      if(effect !== activeEffect){
        if(effect.scheduler){
          //如果用户传入了 调度函数 则用用户传入的
          effect.scheduler() 
        }else{
          // 否则默认刷新视图
          effect.run()
        }
        
      }
    }) */
    triggerEffects(effects)
  } 
}

export function triggerEffects(effects){
  effects = new Set(effects) // 先copy一份
  effects.forEach(effect=>{
    // 如果在执行effect的时候 effect里面又有数据更新
    // 那么我们就不能执行effect 防止死循环
    if(effect !== activeEffect){
      if(effect.scheduler){
        //如果用户传入了 调度函数 则用用户传入的
        effect.scheduler() 
      }else{
        // 否则默认刷新视图
        effect.run()
      }
      
    }
  })
}





// 1)  我们先搞一个下响应式对象 new Proxy
// 2） effect 默认数据变化要能更新，我们先将正在执行的effect
// 作为全局变量，渲染(取值),我们在get方法中进行依赖收集
// 3) wackMap (对象：map(属性：set(effect)))
// 4) 稍后用户发生数据变化，会通过对象属性来查找对应
// 的effect集合，找到effect全部执行