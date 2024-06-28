import EventEmitter from "events";
const grpc = require('@grpc/grpc-js')
import {loadSync} from '@grpc/proto-loader'
const protoLoader = require('@grpc/proto-loader')
import { RouterAPI } from "./router";
import WebSocket from "ws";

const rpcOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
}

export default class RPCService extends EventEmitter{
  nodes:any = {}
  queue = []
  rpcService:grpc.ProtobufTypeDefinition|grpc.GrpcObject| grpc.ServiceClientConstructor|any

  constructor(){
    super()
  }

  init(cb){
    try{
      const packageDefinition = protoLoader.loadSync(
          "D:/work/hloader/proto/loader.proto",
          rpcOptions
      )
      const rpcService = grpc.loadPackageDefinition(packageDefinition).loader
      this.rpcService = rpcService
      this.emit('loaded')
      cb()
      for(let node of this.queue){
        this.connect(node)
      }
      this.queue = []

    }catch(e){
      console.log('rpc init err',e)
      cb(e)
    }
    const lServices =  {}

  }
  addNode(node:{hostname:string, address:string}){
    if(this.rpcService){
      this.connect(node)
    }else{
      console.log('addnode to queue')
      this.queue.push(node)
    }
  }

  connect(node:string){
    console.log('connecting node')
    const {hostname, address, id} = node;
    //console.log('connecting to rpc',hostname)
    if (this.nodes[id]){
      Object.values(this.nodes[id]).forEach(rpc=>{
        console.log('closing node')
        try{
          rpc.close(()=>{
            console.log('closed rpc')
          })
        }catch(e){

        }
      })
      this.nodes[id] = null
    }
    const svc = ["Loader", "Deployment", "Recording", "Maintain"].reduce((svc, s)=>({[s]:new this.rpcService[s](
              address,
              grpc.credentials.createInsecure()
          ), ...svc}), {})
    Object.keys(svc).forEach(svcName=>{
      const service = svc[svcName]
      const chan = service.getChannel()
      service.waitForReady(Infinity, err=>{
        console.log('waitready', svcName, err)
      })
      const connStatus = err => {
        const state = chan.getConnectivityState()
        //console.log('State changed', svcName, state)
        if (svcName === 'Loader') {
          this.emit('node-status', id, state)
        }
        if(err){
          return
        }
        chan.watchConnectivityState(state, Infinity, connStatus)
      }
      connStatus()
      // chan.watchConnectivityState(state, Infinity, err=>{
      //   const newState = chan.getConnectivityState(false)
      //   console.log('State changed', svcName, newState)
      //   this.emit('node-status', id, newState)
      //   chan.watchConnectivityState(newState, Infinity, err =>{

      //   }
      // })
    })
    this.nodes[id] = svc
    //console.log(this.nodes.hostname)
  }
  call(hostname:string, service:string, method:string, args:any){
    return new Promise((rs, rj)=>{
      console.log(hostname, service, method, args)

      if(this.nodes[hostname]){
        const rpc = this.nodes[hostname][service]
        rpc[method](args, (res:any, err:Error)=>{
            if(err){
              rj(JSON.stringify(err))
            }else{
              rs(res)
            }
        })
      }else{
        rj('method not found')
      }
    })
  }
}


export class RPCApi extends RouterAPI {
  rpc:RPCService = new RPCService()
  constructor(){
    super()
    this.post('/add-node', (req, res)=>{
      this.rpc.addNode(req.body)
      res.sendStatus(200)
    })

    this.post('/start', (req, res)=>{
      this.rpc.init(err=>{
        if(err){
          res.sendStatus(400)
        }else{
          res.sendStatus(200)
        }
      })
    })
    this.post('/stop', (req, res)=>{
      res.sendStatus(200)
    })

    this.ws('/status', (ws:WebSocket, req)=>{
      const listener = (node, status)=>{
        ws.send(JSON.stringify({
          node, status
        }))
      }
      this.rpc.on('node-status', listener)
      ws.on('close', ()=>{
        this.rpc.removeListener('node-status', listener)
      })
    })

    this.ws('/node/:id/:service/:method', (ws:WebSocket, req)=>{
      //console.log("wsss", req.params, req.query)
      const {id, service, method} = req.params
      try{
        const svc = this.rpc.nodes[id][service]
        if(!svc || !svc[method]){
          return ws.close(4000,'method not found')
        }

        if(svc[method].responseStream){
          ws.once('message', msg=>{
            const params = JSON.parse(msg)
            console.log(params)
            const call = svc[method](params)
            call.on('data', data=>{
              console.log('stream data', data)
              ws.send(JSON.stringify({
                type:'data',
                data
              }))
            })
            call.on('error', err=>{
              console.log(err)
              ws.send(JSON.stringify({
                type:'error',
                data:err.toString()
              }))
              ws.close(4000)
            })
            call.on('close', ()=>{
              try{
                ws.close(1000)
              }catch(e){

              }
            })
            ws.on('message', msg=>{
              console.log(msg)
              const params = JSON.parse(msg)
              call.write(params)
            })
          })
        }else{
          ws.once('message', msg=>{
            const params = JSON.parse(msg)
            svc[method](params, (err, data)=>{
              if(err){
                console.log('rpc err', err)
                ws.send(JSON.stringify({
                  type: 'error',
                  data: err.toString()
                }))
                ws.close(4000)
              }else{
                ws.send(JSON.stringify({
                  type:'data',
                  data
                }))
                ws.close(1000)
              }
            })
          })
        }

      }catch(e){
        console.log('call err',e)
      }
    })
  }
}
