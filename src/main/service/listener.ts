import EventEmitter from "events";
import { Socket, createSocket } from "dgram";
import WebSocket from "ws";
import { RouterAPI } from "./router";
export class NodeListener extends EventEmitter{
  rx:Socket|null

  constructor(){
    super()
    this.rx = null
  }


  listen(opts:{interface:string, group:string, port:number|undefined},cb){
    if (this.rx){
      return cb()
    }
    this.rx = createSocket({
      type:'udp4',
      reuseAddr:true
    })
    this.rx.bind(opts.port, opts.interface, ()=>{
      this.emit('listening')
      this.rx.addMembership(opts.group, opts.interface)
      if (cb){
        cb()
      }
    })
    .on('message', (data, rsInfo)=>{
      this.handleMessage(data)
    })
    .on('error', err=>{
      cb(err)
    })
  }
  handleMessage(data: Buffer) {
    const [hostname, address] = data.toString().split('|')
    this.emit('heartbeat',{id:11, hostname, address, lastUpdate: new Date().toISOString().split('.')[0] })
  }
  stop(cb){
    if(!this.rx){
      return cb()
    }

    this.rx.close(()=>{
      console.log('mc listener stopped')
      this.rx = null
      if(cb){
        cb()
      }
    })
  }
}

export class ListenerAPI extends RouterAPI{
  mc = new NodeListener()
  constructor(){
    super()



    this.ws('/notify', (ws:WebSocket, req)=>{
      //console.log('notify connected')
      const cb = hb => {
        ws.send(JSON.stringify(hb))
      }
      this.mc.on('heartbeat', cb)
      ws.on('close', ()=>{
        //console.log('ws closed')
        this.mc.removeListener('heartbeat', cb)
      })
    })

    this.post('/start', (req,res)=>{
      this.mc.listen(req.body, err=>{
        if(err)
          console.log(err)
        res.sendStatus(200)
      })
    })

    this.post('/stop', (req,res)=>{
      this.mc.stop(()=>{
        res.sendStatus(200)
      })
    })
  }

}
