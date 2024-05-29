import { EventEmitter } from "events";
import fs from 'fs'
const express = require('express'),
  dhcp = require('dhcp'),
  tftp = require('tftp');

export class PXEServer extends EventEmitter{
  tftpSvr
  httpSvr
  httpApp
  dhcpSvr
  constructor(){
    super()
  }

  start(opts){
    if(this.httpSvr){
      return
    }
    const {
      port,
      address,
      root='C:/Users/ubozkurt/Desktop/work/pxe/root',
      tftpPort = 69,

    } = opts
    console.log('starting pxe server', root, tftpPort);

    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()){
      fs.mkdirSync(root)
    }
    const http = express();
    this.httpApp = http;
    http.use(express.static(root));

    this.httpSvr = http.listen(port, address, ()=>{
      this.emit("http.started")


      this.tftpSvr = tftp.createServer({
        host: address,
        port: tftpPort,
        root: root,
        denyPUT: true,
      })

      this.tftpSvr.on('listening',()=>{
        console.log('tftp listening')
        this.emit('tftp.started')

        dhcp.addOption(97, {
          config: "ClientID",
          type: "ASCII",
          name: "UUID/GUID-based client identifier"
        })
        this.dhcpSvr = dhcp.createServer({
          // System settings
          range: [
            "10.10.11.50", "10.10.11.254"
          ],
          //forceOptions: ['hostname'], // Options that need to be sent, even if they were not requested
          randomIP: true, // Get random new IP from pool instead of keeping one ip

          // Option settings (there are MUCH more)
          netmask: '255.255.0.0',
          router: [
            address
          ],
          dns: ["8.8.8.8", "8.8.4.4"],
          hostname: "hloadmgr",
          broadcast: '255.255.255.255',
          server: address, // This is us,
          tftpServer: address,
          //bootFileSize: 672640,
          bootFile: function (req, res) {

            // res.ip - the actual ip allocated forW the client
            return '\\ipxe.efi'
          }
        });

        this.dhcpSvr.on('listening', () => {
            console.log('dhcp')
            this.emit('dhcp.started')
            this.emit('listening')
          })
          .on('error', (err:Error)=>{
            console.log('dhcp err:',err)
          })
          .listen(null, address);
      })
      .on('error', (err:any)=>{
        console.log('tftp err',err)
      })
      .on('close', ()=>{
        console.log('tftp stopped')
      })
      .listen()

    })

  }

  stop(){
    console.log('stoping http server')
    this.httpSvr.close(()=>{
      console.log('http stopped')
    })
    this.tftpSvr.close(()=>{
      console.log('tftp stopped')
    })
    this.dhcpSvr.close(()=>{
      console.log('dhcp stopped')
    })
  }
}
