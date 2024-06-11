import EventEmitter from 'events'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'

const port = window.location.search.split('port=')[1]

const start = async ()=>{
  const Url =`http://localhost:${port}/rpc/start`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      interface:'10.10.11.1',
      port:16644,
      group:'239.0.0.72'
    })
  });
  const data = await raw.json()

}

const stop = async ()=>{
  const Url =`http://localhost:${port}/rpc/stop`
  const raw = await fetch(Url, {
    method:'POST',
  });
};
const addNode = async node => {
  const Url =`http://localhost:${port}/rpc/add-node`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(node)
  });
}

const invoke = (node, service, method, param) => {

  const Url =new URL(`ws://localhost:${port}/rpc/node/${node}/${service}/${method}`)
  //Url.searchParams.append('test','123\\123')
  const wss  =new WebSocket(Url)
  wss.onopen = ()=>{
    console.log('open rpc')
    if(param){
      wss.send(JSON.stringify(param))
    }
  }
  wss.onmessage =  msg=>{
    emitter.emit('data',JSON.parse(msg.data))
  }
  wss.onerror = err=>{
    console.log('ws err',err)
  }
  wss.onclose= e=>{
    if(e.code/1000<2){
      try{
        emitter.emit('done', undefined, e.reason)
      }catch(e){
        console.log(e)
        emitter.emit('done', e.toString())
      }
    }else{
      console.log(e.reason)
      emitter.emit('done', e.reason)
    }
  }
  const emitter = new EventEmitter()
  emitter.send = data=>{
    wss.send(data)
  }
  return emitter
}

export default (props) => {

  const [connected, setConnected] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(()=>{

    if(open){
      (async()=>{
        try{
          await start()
          setConnected(true)
        }catch(e){
          setConnected(false)
        }
      })()
      return async ()=>{
        await stop()
        setConnected(false)
      }
    }

  }, [open])

  return {
    start: ()=>{setOpen(true)},
    stop: ()=>{setOpen(false)},
    addNode,
    invoke,
    connected
  }
}


