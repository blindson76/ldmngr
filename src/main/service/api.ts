import { EventEmitter } from "ws";

import expressWs from 'express-ws'
import { Listener, ListenerAPI, NodeListener } from "./listener";
import { PXEApi, PXEServer } from "./pxe";
import { RPCApi } from "./rpc";
const express = require('express'),
  dhcp = require('dhcp'),
  tftp = require('tftp');

export default class LMApi extends EventEmitter {
  app = express()
  ws = expressWs(this.app)

  //
  mc = new ListenerAPI()
  pxe = new PXEApi()
  rpc = new RPCApi()


  constructor(){
    super()
    console.log('setup api')

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
    this.app.post('/start', (req,res)=>{
      this.app.use('/', express.static(req.body.root))
      console.log("api start", req.body)
      setTimeout(()=>{
        res.send({status:'OK'})
      },200)
    })
  }
}


