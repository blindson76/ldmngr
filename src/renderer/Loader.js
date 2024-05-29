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

const Loader = () => {


    const Footer = handleClick => {
        return (
            <div>
                <Button label="Ok" onClick={handleClick}></Button>
            </div>
        )
    }
    const [nodes, setNodes] = useState({})
    const [services, setServices] = useState({})
    const api = useApi()
    useEffect(()=>{
      const rem = api.on('mc.heartbeat', (data)=>{
        setNodes({...nodes, [data.hostname]:data})
      })
      return ()=>{
        console.log('removing listener')
        rem()
      }
    }, [])

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
        <Button icon="pi pi-sign-out" tooltip='Logoff' rounded aria-label="Filter" size="small" onClick={()=>{
                services[node.hostname].Loader.PowerCtl({
                    order: 'Logoff'
                }, (err, res)=>{
                    console.log("res", res, "err", err)
                })
        }}/>
        <Button icon="pi pi-refresh" tooltip='Restart' rounded aria-label="Filter" size="small" onClick={()=>{
                services[node.hostname].Loader.PowerCtl({
                    order: 'Restart'
                }, (err, res)=>{
                    console.log("res", res, "err", err)
                })
        }}/>
        <Button icon="pi pi-power-off" tooltip='Shutdown' rounded aria-label="Filter" size="small" onClick={()=>{
                services[node.hostname].Loader.PowerCtl({
                    order: 'Shutdown'
                }, (err, res)=>{
                    console.log("res", res, "err", err)
                })
        }}/>
        <Button icon="pi pi-microsoft" tooltip='Restart to Win' rounded aria-label="Filter" size="small" onClick={()=>{
                services[node.hostname].Loader.PowerCtl({
                    order: 'RestartTo',
                    param: 1
                }, (err, res)=>{
                    console.log("res", res, "err", err)
                })
        }}/>

        <Button icon="pi pi-android" tooltip='Restart To Linux' rounded aria-label="Filter" size="small" onClick={()=>{
            console.log(services[node.hostname])

            services[node.hostname].Loader.PowerCtl({
                order: 'RestartTo',
                param: 2
            }, (err, res)=>{
                console.log("res", res, "err", err)
            })
        }}/>
        <Button icon="pi pi-angle-right" tooltip='Exec command' rounded aria-label="Filter" size="small" onClick={()=>setExec(e=>({...e, node, visible: true}))}/>
        <Button icon="pi pi-upload" tooltip='Upload File' rounded aria-label="Filter" size="small" onClick={async (node)=>{
            fileRef.current.click()

        }} />
        <Button tooltip="Format disk" icon="pi pi-database" rounded aria-label="Filter" size="small" onClick={()=>{
            console.log(services[node.hostname])
            services[node.hostname].Maintain.FormatDisks({
                disks: [
                    {
                        location:'pci0000:00/0000:00:01.1',
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
            .on('error',console.log)
            .on('data',data=>{
                console.log(data.status.toString("utf-8"))
                setUploaded(data.status.toString("utf-8"))
            })
            .on('end',()=>{
                console.log('finish')
            })
        }}/>
        <Button icon="pi pi-clone" tooltip='Prepare ESP' rounded aria-label="Filter" size="small" onClick={()=>{
            const call = services[node.hostname].Maintain.ApplyImage({
                imagePath:'esp.wim',
                imageIndex:1,
                targetDisk:'pci0000:00/0000:00:01.1',
                targetPartition:1
            })
            .on('error',console.log)
            .on('data',data=>{
                console.log(data.status.toString("utf-8"))
                setUploaded(data.status.toString("utf-8"))
            })
            .on('end',()=>{
                console.log('finish')
            })
            .on('close',()=>{
                console.log('finish')
            })
        }}/>
        <Button icon="pi pi-wrench" tooltip='BCDFix' rounded aria-label="Filter" size="small" onClick={()=>{
            const call = services[node.hostname].Maintain.BCDFix({
                espDisk:'pci0000:00/0000:00:01.1',
                espPartition:1,
                osDisk:'pci0000:00/0000:00:01.1',
                osPartition:2,
            }, (data,err)=>{
                console.log(data, err)
            })
        }}/>

<Button icon="pi pi-database" tooltip='Load OS' rounded aria-label="Filter" size="small" onClick={()=>{
            const call = services[node.hostname].Maintain.ApplyImage({
                imagePath:'winpe.wim',
                imageIndex:1,
                targetDisk:'pci0000:00/0000:00:01.1',
                targetPartition:2
            })
            .on('error',console.log)
            .on('data',data=>{
                console.log(data.status.toString("utf-8"))
                setUploaded(data.status.toString("utf-8"))
            })
            .on('end',()=>{
                console.log('finish')
            })
            .on('close',()=>{
                console.log('finish')
            })
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
        console.log('click', exec)
        const [proc, ...args] = exec.command.split(' ')
        services[exec.node.hostname].Deployment.Exec({
            Proc: proc,
            Args: args
        }, (err, res)=>{
            console.log("res", res, "err", err)
            setExec(e=>({...e, result:res.Out}))
        })
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

  const [checked, setChecked] = useState(true)


  useEffect(()=>{
    if(checked) {
      console.log('starting pxe')
      api.invoke('pxe','start', {
        port:80,
        address:'10.10.11.1'
      })

      api.invoke('mc','listen', {
        port:16644,
        interface:'10.10.11.1',
        group:'239.0.0.72'
      })

      return ()=>{
        console.log('stopping pxe')
        api.invoke('pxe','stop')
        api.invoke('mc','stop')
      }
    }

  }, [checked])
  return (
    <>
      <input type='checkbox' checked={checked} onChange={()=>setChecked(!checked)}/>
      <Loader />
    </>
  )
}
