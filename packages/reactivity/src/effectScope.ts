
export let activeEffectScope = null;

class EffectScope{
  active = true;
  parent = null;
  effects = []; // 记录的effect
  scopes = []; // effectScope 还有可能要收集子集的effectScope
  constructor(detached){
    // 只有不独立的才要收集
    if(!detached && activeEffectScope){
      activeEffectScope.scopes.push(this)
    }
    
  }
  run(fn){
    if(this.active){
     try {
        this.parent = activeEffectScope
        activeEffectScope = this
        return fn()
     } finally{
        activeEffectScope = this.parent
     }
    }
  }
  stop(){
    if(this.active){
      for(let i = 0 ; i < this.effects.length ;i++){
        this.effects[i].stop()
      }
      for(let i = 0 ; i < this.scopes.length ;i++){
        this.scopes[i].stop()
      }
      this.active = false
    }
  }
}

export function recordEffectScope(effect){
  if(activeEffectScope && activeEffectScope.active){
    activeEffectScope.effects.push(effect)
  }

}
export function effectScope(detached = false){
   return  new EffectScope(detached)
}