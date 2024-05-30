import { EventEmitter } from "stream";

export class EventMon extends EventEmitter{
  emitters: Record<string, EventEmitter>
  constructor(emitters: Record<string, EventEmitter>){
    super()
    this.emitters = emitters;
    const that = this
    for (let entry of Object.entries(emitters)){
      const [name, emitter] = entry
      const oldEmit = emitter.emit;

      // emitter.emit = function(eventType:string|symbol, ...args:any):boolean{
      //   that.emit(`${name}.${String(eventType)}`, ...args)
      //   return oldEmit.call(emitter, eventType, ...args)
      // }

      emitter.emit = function(eventType:string|symbol, ...args:any):boolean{
        that.emit("event", {
          source: name,
          event:eventType,
          data: args
        })
        return oldEmit.call(emitter, eventType, ...args)
      }
    }
  }


  publish(target:string, method:string, args:any[]){
    try{
      this.emitters[target][method].apply(this.emitters[target], args)
    }catch(e){
      console.log(e)
    }
  }
}
