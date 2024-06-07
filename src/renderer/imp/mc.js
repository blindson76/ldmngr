import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'

const CreateApi = opts => {
    const rxRef = useRef(null)
    const [nodes, setNodes] = useState({})
    const [services, setServices] = useState({})

    useEffect(()=>{
    },[])

    return window.service
}
const port = window.location.search.split('port=')[1]

const start = async ()=>{
  const Url =`http://localhost:${port}/mc/start`
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
  const Url =`http://localhost:${port}/mc/stop`
  const raw = await fetch(Url, {
    method:'POST'
  });
};

export default opts =>{
  const [connected, setConnected] = useState(false)
  const [open, setOpen] = useState(false)
  const [nodes, setNodes] = useState({})

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


  const socketUrl =`ws://localhost:${port}/mc/notify`
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => console.log('opened'),
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
    onMessage: msg=>{
      const data = JSON.parse(msg.data)
      setNodes(nodes => {
        if (!nodes[data.hostname] || nodes[data.hostname].address != data.address){
          console.log('adding node')
          if(opts.onNode){
            opts.onNode(data)
          }

          //api.invoke('rpc','addNode',data)
        }
        return {...nodes, [data.hostname]:data}
      })
    },
    connected

  });



  return {
    start: ()=>{setOpen(true)},
    stop: ()=>{setOpen(false)},
    nodes,
  }
}


