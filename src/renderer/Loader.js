/* eslint no-use-before-define: 0 */
import { PrimeReactProvider } from 'primereact/api';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useApi } from './serviceProvider';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useMC, usePXE, useRPC } from './imp/service';

const Loader = props => {



    const Footer = handleClick => {
        return (
            <div>
                <Button label="Ok" onClick={handleClick}></Button>
            </div>
        )
    }

    const [services, setServices] = useState({})
    const api = useApi()
    const {mc, rpc, pxe} = props


    const {nodes, start:startMC, stop:stopMC, status} = useMC({
      onNode: async node => {
        console.log(node)
        await addNode(node)
      }
    })
    const {start:startPXE, stop:stopPXE} = usePXE()
    const {start:startRPC, stop:stopRPC, addNode, invoke} = useRPC()



    useEffect(()=>{
      if(mc){
        startMC()
      }
      else{
        stopMC()
      }
      return ()=>{
        console.log('removing listener')
      }
    }, [mc])

    useEffect(()=>{
      if(pxe){
        startPXE({
          interface:'10.10.11.1',
          address:'10.10.11.1',
          port:16644,
          group:'239.0.0.72',
          root:'C:/Users/ubozkurt/Desktop/work/pxe/root'
        })
      }
      else{
        stopPXE()
      }
      return ()=>{
        console.log('removing listener')
      }
    }, [pxe])

    useEffect(()=>{
      if(rpc){
        startRPC()
      }
      else{
        stopRPC()
      }
      return ()=>{
        console.log('removing listener')
      }
    }, [rpc])



    useCallback(()=>{
      console.log('cbb')
    }, [])

    const [exec, setExec] = useState({
        visible: false,
        command:'ipconfig',
        node:null,
        result:''
    })
    const fileRef = useRef()
    const [uploaded, setUploaded] = useState("")
    const Action = (node, order) => {
      return (<>
        <Button icon="pi pi-sign-out" tooltip='Logoff' rounded aria-label="Filter" size="small" onClick={async ()=>{
                try{
                  const call = invoke(node.id, 'Loader','PowerCtl', {
                    order:'Logoff'
                  })
                  .on('done', (err, res)=>{
                    if(err){
                      setUploaded(err)
                    }else{
                      console.log(res)
                      setUploaded(res.Message)
                    }
                  })
                  .on('data', data=>{
                    console.log(data)
                  })
                  //console.log('rrr',res)
                  //setUploaded(res.toString())

                }
                catch(e){

                  setUploaded(JSON.parse(e.toString()))
                }
        }}/>
        <Button icon="pi pi-refresh" tooltip='Restart' rounded aria-label="Filter" size="small" onClick={()=>{

                try{
                  const call = invoke(node.id, 'Loader','PowerCtl', {
                    order:'Restart'
                  })
                  .on('done', (err, res)=>{
                    if(err){
                      setUploaded(err)
                    }else{
                      console.log(res)
                      setUploaded(res.Message)
                    }
                  })
                  .on('data', data=>{
                    console.log(data)
                  })
                  //console.log('rrr',res)
                  //setUploaded(res.toString())

                }
                catch(e){

                  setUploaded(e.toString())
                }
        }}/>
        <Button icon="pi pi-power-off" tooltip='Shutdown' rounded aria-label="Filter" size="small" onClick={()=>{

                try{
                  const call = invoke(node.id, 'Loader','PowerCtl', {
                    order:'Shutdown'
                  })
                  .on('done', (err, res)=>{
                    if(err){
                      setUploaded(err)
                    }else{
                      console.log(res)
                      setUploaded(res.Message)
                    }
                  })
                  .on('data', data=>{
                    console.log(data)
                  })
                  //console.log('rrr',res)
                  //setUploaded(res.toString())

                }
                catch(e){

                  setUploaded(e.toString())
                }
        }}/>
        <Button icon="pi pi-microsoft" tooltip='Restart to Win' rounded aria-label="Filter" size="small" onClick={()=>{

                try{
                  const call = invoke(node.id, 'Loader','PowerCtl', {
                    order:'RestartTo',
                    bootEntry:'HARDDISK'
                  })
                  .on('done', (err, res)=>{
                    if(err){
                      setUploaded(err)
                    }else{
                      console.log(res)
                      setUploaded(res.Message)
                    }
                  })
                  .on('data', data=>{
                    console.log(data)
                  })
                  //console.log('rrr',res)
                  //setUploaded(res.toString())

                }
                catch(e){

                  setUploaded(e.toString())
                }
        }}/>

        <Button icon="pi pi-android" tooltip='Restart To Linux' rounded aria-label="Filter" size="small" onClick={()=>{

            try{
              const call = invoke(node.id, 'Loader','PowerCtl', {
                order:'RestartTo',
                bootEntry:'PXE'
              })
              .on('done', (err, res)=>{
                if(err){
                  setUploaded(err)
                }else{
                  console.log(res)
                  setUploaded(res.Message)
                }
              })
              .on('data', data=>{
                console.log(data)
              })
              //console.log('rrr',res)
              //setUploaded(res.toString())

            }
            catch(e){

              setUploaded(e.toString())
            }
        }}/>
        <Button icon="pi pi-angle-right" tooltip='Exec command' rounded aria-label="Filter" size="small" onClick={()=>setExec(e=>({...e, node, visible: true}))}/>
        <Button icon="pi pi-upload" tooltip='Upload File' rounded aria-label="Filter" size="small" onClick={async (node)=>{
            fileRef.current.click()

        }} />
        <Button tooltip="Format disk" icon="pi pi-database" rounded aria-label="Filter" size="small" onClick={()=>{

            try{
              const call = invoke(node.id, 'Maintain','FormatDisks', {
                disks: [
                    {
                        location:'pci0000:00/0000:00:0d.0',
                        partitionType:'gpt',
                        partitions: [
                            {
                                size:512,
                                type:'fat32',
                                label:'ESP',
                                flags:['esp','boot'],
                                format:true
                            },
                            {
                                size:32000,
                                type:'ntfs',
                                label:'AppSys',
                                flags:['msftdata'],
                                format: true
                            }
                        ]
                    }
                ]
            })
              .on('done', (err, res)=>{
                if(err){
                  setUploaded(err)
                }else{
                  setUploaded("Success")
                }
              })
              .on('data', data=>{
                setUploaded(data.status)
              })
              //console.log('rrr',res)
              //setUploaded(res.toString())

            }
            catch(e){
              console.log('err',e)
              setUploaded(e.toString())
            }

        }}/>
        <Button icon="pi pi-clone" tooltip='Prepare ESP' rounded aria-label="Filter" size="small" onClick={()=>{
          try{
            const call = invoke(node.id, 'Maintain','ApplyImage', {
              imagePath:'esp.wim',
              imageIndex:1,
              targetDisk:'pci0000:00/0000:00:0d.0',
              targetPartition:1
          })
            .on('done', (err, res)=>{
              if(err){
                setUploaded(err)
              }else{
                setUploaded("Success")
              }
            })
            .on('data', data=>{
              setUploaded(data.status)
            })

            //console.log('rrr',res)
            //setUploaded(res.toString())

          }
          catch(e){
            console.log('err',e)
            setUploaded(e.toString())
          }
        }}/>
        <Button icon="pi pi-wrench" tooltip='BCDFix' rounded aria-label="Filter" size="small" onClick={()=>{
          try{
            const call = invoke(node.id, 'Maintain','BCDFix', {
              espDisk:'pci0000:00/0000:00:0d.0',
              espPartition:1,
              osDisk:'pci0000:00/0000:00:0d.0',
              osPartition:2,
          })
            .on('done', (err, res)=>{
              if(err){
                setUploaded(err)
              }else{
                setUploaded("Success")
              }
            })
            .on('data', data=>{
              setUploaded(data.status)
            })

            //console.log('rrr',res)
            //setUploaded(res.toString())

          }
          catch(e){
            console.log('err',e)
            setUploaded(e.toString())
          }
        }}/>

<Button icon="pi pi-database" tooltip='Load OS' rounded aria-label="Filter" size="small" onClick={()=>{
    try{
      const call = invoke(node.id, 'Maintain','ApplyImage', {
        imagePath:'winpe.wim',
        imageIndex:1,
        targetDisk:'pci0000:00/0000:00:0d.0',
        targetPartition:2
    })
      .on('done', (err, res)=>{
        if(err){
          setUploaded(err)
        }else{
          setUploaded("Success")
        }
      })
      .on('data', data=>{
        console.log(data)
        setUploaded(data.status)
      })

      //console.log('rrr',res)
      //setUploaded(res.toString())

    }
    catch(e){
      console.log('err',e)
      setUploaded(e.toString())
    }
        }}/>
        <div>
        <input style={{visibility:'hidden'}} type="file" nwdirectory="" ref={fileRef} onChange={async e=>{
            console.log('selected',e.target.files[0].path)

            upload(e.target.files[0].path, node)
        }}/>
        </div>
      </>)
    }
    const style={style:{fontFamily:'monospace'}}
    const handleClick = ()=>{
        const [proc, ...args] = exec.command.split(' ')
        try{
          const call = invoke(exec.node.id, 'Deployment','Exec', {
            Proc: proc,
            Args: args
        })
          .on('done', (err, res)=>{
            if(err){
              setExec(e=>({...e, result:err}))
            }else{
              //console.log(res)
              //setExec(e=>({...e, result:res}))
            }
          })
          .on('data', data=>{
            //console.log(data.Out)
            setExec(e=>({...e, result:data.Out}))
          })
          //console.log('rrr',res)
          //setUploaded(res.toString())

        }
        catch(err){

          setExec(e=>({...e, result:err}))
        }
    }

    return (
      <div className="card" >
          <DataTable value={Object.values(nodes)} tableStyle={{ minWidth: '50rem' }} size="small" unstyled={false} style={{backgroundColor:'#a90'}}>
              <Column field="hostname" header="Name"  {...style}></Column>
              <Column field="address" header="Address" {...style}></Column>
              <Column field="lastUpdate" header="LastUpdate" {...style}></Column>
              <Column header="Control" body={(m,i)=>Action(m, 'Logoff')}></Column>
              <Column header="Status" body={(m,i)=>uploaded} {...style}></Column>
          </DataTable>
          <Dialog header="Exec" visible={exec.visible} onHide={()=>setExec(e=>({...e, visible: false}))} footer={Footer(handleClick)}>
            <div>
                <span>
                    <i className='pi pi-angle-right' />
                    <InputText placeholder='command' value={exec.command} onChange={(e)=>setExec(ce=>({...ce, command: e.target.value}))} />
                </span>
            </div>
            <div><InputTextarea contentEditable={false} value={exec.result}></InputTextarea></div>
          </Dialog>
      </div>
    )
}

export default () =>{

  const api = useApi()

  useEffect(()=>{

    const port = window.location.search.split('port=')[1]
    const Url =`http://localhost:${port}/start`
    const raw = fetch(Url, {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        root:'C:/Users/ubozkurt/Desktop/work/pxe/root'
      })
    }).then(raw=>raw.json())
    .then(res=>console.log(res))
    .catch(e=>console.log(e))
  }, [])

  const [mc, setMC] = useState(true)
  const [pxe, setPXE] = useState(true)
  const [rpc, setRPC] = useState(true)

  const {start:startRPC, stop:stopRPC, addNode, invoke} = useRPC()



  return (
    <>
      <input type='checkbox' checked={mc} onChange={()=>setMC(!mc)}/>
      <label>mc</label>
      <input type='checkbox' checked={pxe} onChange={()=>setPXE(!pxe)}/>
      <label>pxe</label>
      <input type='checkbox' checked={rpc} onChange={()=>setRPC(!rpc)}/>
      <label>rpc</label>
      <button type='button' onClick={async ()=>{
        try{
          const call = invoke(11, "Loader", "PowerCtl", {
            order:'Logoff'
          })
          .on('data', data=>{
            console.log('data', data)
          })
          .on('done', (err, res)=>{
            console.log('done', err, res)
          })
        }catch(e){

        }
      }}>Test</button>
      <Loader {...{mc,pxe,rpc}}/>
    </>
  )
}
