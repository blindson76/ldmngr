import EventEmitter from "events";
import grpc, {loadPackageDefinition, credentials} from '@grpc/grpc-js'
import {load} from '@grpc/proto-loader'

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

  init(){
    console.log('rpc init')
    load(
        "C:/Users/ubozkurt/Desktop/work/hloader/proto/loader.proto",
        rpcOptions
    )
    .then(packageDefinition=>{
      const rpcService = loadPackageDefinition(packageDefinition).loader
      this.rpcService = rpcService
      this.emit('loaded')
      for(let node of this.queue){
        this.connect(node)
      }
      this.queue = []

    })
    .catch(e=>{
      console.log(e)
    })
    const lServices =  {}
    // Object.values(nodes).forEach(node=>{
    //     const {hostname, address} = node
    //     lServices[hostname] = ["Loader", "Deployment", "Recording", "Maintain"].reduce((svc, s)=>({[s]:new rpcService[s](
    //         address,
    //         grpc.credentials.createInsecure()
    //     ), ...svc}), {})
    // })
    // setServices({...lServices})

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

    const {hostname, address} = node;
    console.log('connect to rpc',hostname)
    if (this.nodes[hostname]){
      Object.values(this.nodes[hostname]).forEach(rpc=>{
        rpc.close(()=>{
          console.log('closed rpc')
        })
      })
      this.nodes[hostname] = null
    }
    const svc = ["Loader", "Deployment", "Recording", "Maintain"].reduce((svc, s)=>({[s]:new this.rpcService[s](
              address,
              credentials.createInsecure()
          ), ...svc}), {})
    this.nodes[hostname] = svc
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
