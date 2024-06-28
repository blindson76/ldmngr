import { EventEmitter } from "events";
import fs from 'fs'
import { RouterAPI } from "./router";
import dhcp from 'dhcp';
import tftp from 'tftp';

export class PXEServer extends EventEmitter{
  tftpSvr
  dhcpSvr
  constructor(){
    super()
  }

  start(opts, cb){
    console.log('start pxe', opts)
    if(this.tftpSvr){
      return cb()
    }
    const {
      port,
      address,
      root='D:/work/root',
      tftpPort = 69,
      dhcpOpts={},

    } = opts

    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()){
      fs.mkdirSync(root)
    }


      this.tftpSvr = tftp.createServer({
        host: address,
        port: tftpPort,
        root: root,
        denyPUT: true,
      })

      this.tftpSvr.on('request', (req, res)=>{
        req.on('error', err=>{
          //console.log('tftp req err', err)
        })
        console.log('tftp:', req.file)
      })

      this.tftpSvr.on('listening',()=>{
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

        dhcp.addOption(77, {
          config: "userClass",
          type: "UInt8s",
          name: "userClass"
        })
        dhcp.addOption(93, {
          config: "clientSystem",
          type: "UInt8s",
          name: "clientSystem"
        })
        dhcp.addOption(94, {
          config: "clientNDI",
          type: "UInt8s",
          name: "clientNDI"
        })
        dhcp.addOption(175, {
          config: "etherBoot",
          type: "UInt8s",
          name: "etherBoot"
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
            this.emit('dhcp.started')
            this.emit('listening')
            if(cb){
              cb()
            }
          })
          .on('error', (err:Error)=>{
            //console.log('dhcp err:',err)
          })
          .listen(null, address);
      })
      .on('error', (err:any)=>{
        console.log('tftp err',err)
      })
      .on('close', ()=>{
        //console.log('tftp stopped')
      })
      .listen()

  }

  stop(cb){
    console.log('stoping http server')
    this.tftpSvr.close(()=>{
      console.log('tftp stopped')
      cb()
    })
    this.tftpSvr = null
    this.dhcpSvr.close(()=>{
      console.log('dhcp stopped')
    })
  }
}

export class PXEApi extends RouterAPI{
  pxe:PXEServer=new PXEServer()
  constructor(){
    super()
    this.post('/start', (req,res)=>{
      this.pxe.start(req.body, err=>{
        if(err){
          console.log("pxe err",err)
          res.sendStatus(400)
        }else{
          res.sendStatus(200)
        }
      })
    })
    this.post('/stop', (req,res)=>{
      this.pxe.stop(err=>{
        if(err){
          res.sendStatus(400)
        }else{
          res.sendStatus(200)
        }
      })
    })

  }
}
