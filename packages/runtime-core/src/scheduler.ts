let queue = [] //维护一个任务队列

let isFlushing = false //是否正在刷新

const resolvePromise = Promise.resolve()


export function queueJob(job){
  if(!queue.includes(job)){
    queue.push(job)
  }

  if(!isFlushing){ //批处理逻辑
    isFlushing = true
    
    resolvePromise.then(()=>{
      isFlushing = false

      let copyQueue = queue.slice(0)
      queue.length = 0
      for(let i = 0 ; i < copyQueue.length ; i++){
        let job = copyQueue[i]
        job()
      }

      
      copyQueue.length = 0
    })
  }

}