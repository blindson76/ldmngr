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
    method:'POST'
  });
};

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
    connected
  }
}


