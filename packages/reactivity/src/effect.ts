export let activeEffect = undefined //当前正在执行的effect是谁
let shouldTrack // 当前这个 实例需不需要 收集依赖

export class ReactiveEffect{
  // 标记当前effect的父级是谁
  public parent = null;
  // 用户反向记录 effect 中依赖了那些属性
  public deps = []
  // 标记当前的effect 是否是激活状态
  public active = true
  public onStop?: () => void // onStop hooks
  // schefuler 用户自定义调度器
  constructor(public fn: any,public schefuler: any){}
  run(){
    // 如果当前的effect是非激活的状态
    // 只执行传入的函数 
    if(!this.active){
      return this.fn()
    }
    try{
      // 记录当前effect的父级
      this.parent = activeEffect
      // 当前的effect
      activeEffect = this
      // 在执行用户函数之前将之前effect收集的dep清空
      cleanupEffect(this)
      shouldTrack = true
      let result = this.fn()
      shouldTrack = false
      return result
    }finally{
      // 结束后 指向父级
      activeEffect = this.parent
    }
  }
  stop(){
    if(this.active){
      this.active = false
      cleanupEffect(this)
    }
    // 如果传入了 onStop 就执行
    if (this.onStop) this.onStop()
  }
}


// 3.0最早关于嵌套effect的处理是采用栈
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




export function effect(fn,options:Object = {}){
  const _effect = new ReactiveEffect(fn,options)
  // 默认执行一次
  _effect.run()

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect //将effect挂载到runner函数上
  
  return runner
}



// 保存每一个 target 的 WeakMap
const targetMap = new WeakMap()

// 收集依赖
/**
 *  // 构造下面的数据结构
 *  new WeakMap({
 *    key:{name:'zx',age:18},  //target
 *    value:new Map({
 *        name:new Set([effect1,effect2]),
 *        age: new Set([effect1])
 *    })
 *  })
 *  
 */
export function track(target,key){
  if(!isTracking()) return
  let depsMap = targetMap.get(target)
  // 第一次获取没有 新建一个 map 并存入 weakMap
  if(!depsMap){
    targetMap.set(target,(depsMap = new Map()))
  }
  // 拿到当前 key 的对应的 set 
  // 每个对应 key 底下应该保存着自己的 set， set里边是所有的依赖 ReactiveEffect)
  let dep = depsMap.get(key)
  // 第一次获取没有  创建一个新的 set 并存入对应的 map
  if(!dep){
    depsMap.set(key,(dep = new Set()))
  }
/**
 * //这种情况下 name对应的 effect只收集一次就行
 * effect(()=>{
 *  state.name
 *  state.name
 *  state.name
 * })
 * 
*/
  if(!dep.has(activeEffect)){
    dep.add(activeEffect)
    /**
     * 至此 上述代码 只做了单向的记录 
     * 属性记录了effect  但是如果effect删除了 这个属性任然还记录这个effect
     * 我们需要再进行下 反向记录 
     * 让effect 也记录下属性对应的set
     * 这样做的好处是 可以清理
     * 
    */
    activeEffect.deps.push(dep)
  }
}

// 触发更新
export function trigger(target,key){
  const depsMap = targetMap.get(target)
  // 触发的target不在收集的依赖中 则不更新
  if(!depsMap) return
  // 找到 属性（name或者age）对应的 [effect1,effect2]
  let effects = depsMap.get(key)

  if(effects){
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


function cleanupEffect(effect){
  const {deps} = effect
  for(let i = 0 ; i < deps.length ; i++){
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}

export function stop(runner){
  runner.effect.stop()
}



// 判断当前的 实例 需不需要收集依赖
function isTracking() { 
  return shouldTrack && activeEffect !== undefined
}