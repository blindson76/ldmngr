import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'

const port = window.location.search.split('port=')[1]

const start = async (opts)=>{
  console.log('starting', opts)
  const Url =`http://localhost:${port}/pxe/start`
  const raw = await fetch(Url, {
    method:'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts)
  });
  const data = await raw.json()

}

const stop = async ()=>{
  const Url =`http://localhost:${port}/pxe/stop`
  const raw = await fetch(Url, {
    method:'POST'
  });
};

export default (props) => {

  const [connected, setConnected] = useState(false)
  const [cfg, setCfg] = useState({
    open:false,
    connected:false,
    opts:{}
  })

  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState()
  useEffect(()=>{

    if(cfg.open){
      (async()=>{
        try{
          await start(cfg.opts)
          setCfg(cfg=>({...cfg, connected:true}))
        }catch(e){
          setCfg(cfg=>({...cfg, connected:false}))
        }
      })()
      return async ()=>{
        await stop()
        setCfg(cfg=>({...cfg, connected:false}))
      }
    }

  }, [cfg.open])

  return {
    start: (opts)=>{setCfg(cfg=>({...cfg, open:true, opts}))},
    stop: ()=>{setCfg(cfg=>({...cfg, open:false}))},
    connected
  }
}


