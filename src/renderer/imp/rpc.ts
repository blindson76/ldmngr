import { ConnectivityState } from '@grpc/grpc-js/build/src/connectivity-state'
import EventEmitter from 'events'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import { node } from 'webpack'
import { useMC } from './service'

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
const addNode = async (node, setNodes) => {
  const Url =`http://localhost:${port}/rpc/add-node`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(node)
  });
  setNodes(nodes=>({...nodes, [node.id]:{...nodes[node.id], address:node.address}}))
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
const loadNodes = configNodes => {
  console.log(configNodes)
  const nodes = configNodes.reduce((cur, node)=>{
    cur[node.id] = {
      hostname: node.name,
      id:node.id,
      address:'',
      lastUpdate:'',
      status:ConnectivityState[0]
    }
    return cur
  }, {})
  return nodes
}
export default ({nodes:configNodes, ...config}, open) => {

  const [nodes, setNodes] = useState(()=>{
    console.log('initial values')
    return loadNodes(configNodes)
  })
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

  useEffect(()=>{
    if(!connected){
      return
    }
    listenStatus(({node,status})=>{
      setNodes(nodes=>{
        const newNodes = {...nodes, [node]:{...nodes[node], status: ConnectivityState[status]}}
        return newNodes
      })
    })

  }, [connected])


  const {connected:mcReady} = useMC({
    config:{
      interface:config?.loader?.address,
      port:config?.loader?.port,
      group: config?.loader?.multicastGroup
    },
    onNode: node=>{
      console.log("node", node)
      addNode(node, setNodes)
    },
    onHeartbeat: node=>{
      setNodes(nodes=>({...nodes, [node.id]:{...nodes[node.id], lastUpdate:node.lastUpdate}}))
    },
    open:connected

  })

  return {
    addNode: node=>addNode(node, setNodes),
    invoke,
    listenStatus,
    nodes,
    connected
  }
}


