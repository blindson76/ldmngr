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

const start = async (opts)=>{
  console.log('starting mc')
  const Url =`http://localhost:${port}/mc/start`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts)
  });
  try{

  const data = await raw.text()
  }catch(e){
    console.log(e)
  }

}

const stop = async ()=>{
  const Url =`http://localhost:${port}/mc/stop`
  const raw = await fetch(Url, {
    method:'POST'
  });
};

export default ({config, onNode, open}) =>{
  if (!config){
    return
  }
  const [connected, setConnected] = useState(false)
  const [nodes, setNodes] = useState({})

  useEffect(()=>{
    if(config && open){
      (async()=>{
        try{
          await start(config)
          setConnected(true)
        }catch(e){
          setConnected(false)
        }
      })()
      return  ()=>{
        stop()
        .then(()=>setConnected(false))
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
    onOpen: () => {
      console.log('mc opened')

    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,

    onMessage: msg=>{
      const data = JSON.parse(msg.data)
      setNodes(nodes => {
        if (!nodes[data.hostname] || nodes[data.hostname].address != data.address){
          if(onNode){
            onNode(data)
          }
        }
        return {...nodes, [data.hostname]:data}
      })
    },
    onError:e=>{
      console.log(e)
    }

  },
  connected);



  return {
    nodes,
    connected,
    sendMessage
  }
}


