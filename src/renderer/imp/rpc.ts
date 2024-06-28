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
    }
  });
  const data = await raw.text()

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

  const emitter = new EventEmitter()
  const Url =new URL(`ws://localhost:${port}/rpc/node/${node}/${service}/${method}`)
  //Url.searchParams.append('test','123\\123')
  const wss  =new WebSocket(Url)
  wss.onopen = ()=>{
    if(param){
      wss.send(JSON.stringify(param))
    }
  }
  wss.onmessage =  (msg)=>{
    const {type, data} = JSON.parse(msg.data)
    emitter.emit(type, data)
  }
  wss.onerror = err=>{
    emitter.emit('error', err)
  }
  wss.onclose= e=>{
    emitter.emit('close')
  }
  emitter.send = data=>{
    wss.send(data)
  }
  return emitter
}
const listenStatus = cb => {
  const Url =new URL(`ws://localhost:${port}/rpc/status`)
  const wss  =new WebSocket(Url)
  wss.onopen = ()=>{
  }
  wss.onmessage =  msg=>{
    cb(JSON.parse(msg.data))
  }
  wss.onerror = err=>{
    console.log('ws err',err)
  }
  wss.onclose= e=>{
    console.log('ws node status closed')
  }
  return ()=>{
    wss.close()
  }
}
export default (open) => {

  const [connected, setConnected] = useState(false)
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
      return ()=>{
        stop()
        .then(()=>setConnected(false))
      }
    }

  }, [open])

  return {
    addNode,
    invoke,
    listenStatus,
    connected
  }
}


