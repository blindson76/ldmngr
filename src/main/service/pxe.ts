import { EventEmitter } from "events";
import fs from 'fs'
import { WS } from "./ws";
const express = require('express'),
  dhcp = require('dhcp'),
  tftp = require('tftp');

export class PXEServer extends EventEmitter{
  tftpSvr
  httpSvr
  httpApp
  dhcpSvr
  ws
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
      dhcpOpts={},

    } = opts
    console.log('starting pxe server', root, tftpPort);

    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()){
      fs.mkdirSync(root)
    }
    const http = express();
    this.ws = new WS(http)
    this.httpApp = http;
    http.use(express.static(root));

    this.httpSvr = http.listen(port, address, ()=>{
      this.emit("http.started", port, address)


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
        dhcp.addOption(43, {
          config: "vendor",
          type: "ASCII",
          name: "deneme123"
        })
        dhcp.addOption(50, {// IP wish of client in DHCPDISCOVER
          name: 'Requested IP Address',
          type: 'IP',
          attr: 'requestedIpAddress',
          config: 'requestedIpAddress'
        })

        dhcp.addOption(60, {// RFC 2132: Sent by client to identify type of a client
          name: 'Vendor Class-Identifier',
          type: 'ASCII',
          attr: 'vendorClassId',
          config: 'vendorClassId'
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
          forceOptions:['vendor'],
          dns: ["8.8.8.8", "8.8.4.4"],
          hostname: "maintenance-pc",
          broadcast: '255.255.255.255',
          server: address, // This is us,
          tftpServer: address,
          vendor:function(req, res){
            if(dhcpOpts.vendor && typeof dhcpOpts.vendor == 'function'){
              return dhcpOpts.vendor(req, res)
            }
            return 'service-pc'
          },
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
