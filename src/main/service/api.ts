import { EventEmitter } from "events";

import expressWs from 'express-ws'
import { ListenerAPI } from "./listener";
import { PXEApi, PXEServer } from "./pxe";
import { RPCApi } from "./rpc";
import express from 'express';

export default class LMApi extends EventEmitter{
  app = express()
  ws = expressWs(this.app)

  //
  mc = new ListenerAPI()
  pxe = new PXEApi()
  rpc = new RPCApi()


  constructor(){
    super()
    this.setup()
    this.app.use('/mc', this.mc)
    this.app.use('/pxe', this.pxe)
    this.app.use('/rpc', this.rpc)
  }

  start() {

    const listener = this.app.listen(80,'0.0.0.0', ()=>{
      this.emit('listening',listener.address().port)
    })
  }

  setup(){
    this.app.use(express.json())
    this.app.use((req, res, next)=>{
      console.log("http:", req.method, req.url)
      next()
    })
    this.app.post('/start', (req,res)=>{
      this.app.use('/', express.static(req.body.root))
      res.send({status:'OK'})
    })
  }
}


