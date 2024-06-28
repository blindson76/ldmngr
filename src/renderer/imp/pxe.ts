import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'

const port = window.location.search.split('port=')[1]

const start = async (opts)=>{
  const Url =`http://localhost:${port}/pxe/start`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts)
  });
  const data = await raw.text()

}

const stop = async ()=>{
  const Url =`http://localhost:${port}/pxe/stop`
  const raw = await fetch(Url, {
    method:'POST'
  });
};

export default (opts) => {

  const [connected, setConnected] = useState(false)
  useEffect(()=>{

    if(opts){
      (async()=>{
        try{
          await start(opts)
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

  }, [])

  return {
    connected
  }
}


