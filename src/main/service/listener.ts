import EventEmitter from "events";
import { Socket, createSocket } from "dgram";
export class NodeListener extends EventEmitter{
  rx:Socket|null

  constructor(){
    super()
    this.rx = null
  }


  listen(opts:{interface:string, group:string, port:number|undefined}){
    if (this.rx){
      return
    }
    this.rx = createSocket({
      type:'udp4',
      reuseAddr:true
    })
    this.rx.bind(opts.port, opts.interface, ()=>{
      this.emit('listening')
      this.rx.addMembership(opts.group, opts.interface)
    })
    .on('message', (data, rsInfo)=>{
      this.handleMessage(data)
    })
  }
  handleMessage(data: Buffer) {
    const [hostname, address] = data.toString().split('|')
    this.emit('heartbeat',{ hostname, address, lastUpdate: new Date().toISOString().split('.')[0] })
  }
  stop(){

    this.rx.close(()=>{
      console.log('mc listener stopped')
      this.rx = null
    })
  }
}
