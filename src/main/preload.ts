// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
const cb = data => {
  console.log(data)
}
const serviceHandler = {
  on(event:string, cb:any){
    const wcb = (_event, ...value) => {
      cb(...value)
    }
    ipcRenderer.on(event, wcb)
    return ()=>ipcRenderer.removeListener(event, wcb) && null
  },
  invoke(target:string, method:string, ...args:any){
    return ipcRenderer.send("invoke", {target, method, args})
  },
  removeListener(event:string, cb:any){
    return ipcRenderer.removeListener(event, cb);
  },
  removeAllListeners(event:string){
    return ipcRenderer.removeAllListeners(event);
  },
  async rpc(node:string, service:string, method:string, args:Object, cb:any){
    return ipcRenderer.invoke('rpc', node, service, method, args);
  },
  async openFileDialog(props:Object){
    return ipcRenderer.invoke('dialog', props)
  }
}
contextBridge.exposeInMainWorld('service', serviceHandler)

export type ServiceHandler = typeof serviceHandler

