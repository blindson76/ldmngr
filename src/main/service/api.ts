import { EventEmitter } from "events";

import expressWs from 'express-ws'
import { ListenerAPI } from "./listener";
import { PXEApi, PXEServer } from "./pxe";
import { RPCApi } from "./rpc";
import express from 'express';
import path from 'path';
import fs from 'fs';

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

    const listener = this.app.listen(0,'127.0.0.1', ()=>{
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
      //this.app.use('/', express.static(path.dirname()))
      const cfg = this.loadConfig(req.body.config)
      if(cfg){
        res.send(cfg)
      }else{
        res.sendStatus(400)
      }
    })
  }
  loadConfig(cfgFile){
    const content = fs.readFileSync(cfgFile, 'utf-8')
    return JSON.parse(content)
  }
}


