import EventEmitter from 'events';
import WebSocket, {WebSocketServer } from 'ws'
import expressWs from 'express-ws'
import express from 'express';

export class WS extends EventEmitter{
  wss:WebSocket.Server
  app:any
  constructor(app:any){
    super();
    this.app = app;
    this.setup()
  }
  setup(){
    this.wss = expressWs(this.app)
    const router = express.Router();
    const mcListener = []
    router.ws('/notify', function(ws:WebSocket, req){
      console.log('notify connected')
    })
    this.app.use('/mc', router)

    // this.app.ws('/', function(ws:WebSocket, req){
    //   console.log('ws connected')
    //   ws.on('message', data=>{
    //     console.log('data')
    //   })
    //   ws.on('close', ()=>{
    //     clearInterval(id)
    //   })
    //   let i=0
    //   let id = setInterval(()=>{
    //     ws.send('testMessage:'+i++)
    //   }, 2000)
    // })
  }

  start(app:any){
    if(this.wss){
      return
    }
    console.log('starting ws server',this.app)
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on('connection', (ws, req) => {
      console.log(new URL(req.url, `http://${req.headers.host}`).searchParams)
      ws.on('error', console.error);

      ws.on('message', data=> {
        console.log('received: %s', data);
      });
      let i=0
      setInterval(()=>{
        ws.send('something'+i++);
      }, 2000)
    });
  }


  stop(){
    if(!this.wss){
      return
    }
    this.wss.close(err=>{
      console.log('es stopped',err)
    })
  }
}
