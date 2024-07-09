import { EventEmitter } from 'events';
import fs, { fchown } from 'fs';
import { RouterAPI } from './router';
import dhcp from 'dhcp';
import tftp from 'tftp';
import express from 'express';
import { ResolveNetwork } from '../util/util';


export class PXEServer extends EventEmitter {
  httpSvr;
  tftpSvr;
  dhcpSvr;
  constructor() {
    super();
    this.initDHCP();
  }

  start(opts, cb) {
    console.log('start pxe', opts);
    if (this.tftpSvr) {
      return cb();
    }
    const {
      port,
      address,
      root = 'D:/work/root',
      tftpPort = 69,
      httpPort = 80,
      dhcpOpts = {},
    } = opts;

    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      fs.mkdirSync(root);
    }

    const {ip, subnet, bounds} = ResolveNetwork(address);
    this.startTFTP({address:ip, port:tftpPort, root})
    .then(()=>this.startHTTP({address:ip, port:httpPort, root}))
    .then((port)=>this.startDHCP({address:ip, dhcpOpts, port}))
    .then(cb)
    .catch(err=>cb(err))
  }

  stop(cb) {
    console.log('stoping http server');
    this.tftpSvr.close(() => {
      console.log('tftp stopped');
      cb();
    });
    this.tftpSvr = null;
    this.dhcpSvr.close(() => {
      console.log('dhcp stopped');
    });
    this.httpSvr.close(()=>{
      console.log('pxe-http stopped')
    })
  }

  startHTTP({address, port, root}){
    console.log("HTTP", port)
    return new Promise((rs,rj)=>{

      const app = express()
      app.use((req, res, next)=>{
        console.log("pxe-http:", req.method, req.url)
        next()
      })
      app.use('/', express.static(root))

      app.on('error', err=>{
        console.log('pxe-http err',err)
      })
      this.httpSvr = app.listen(port, address, ()=>{

        console.log('http listening on', this.httpSvr.address().port)
        rs(this.httpSvr.address().port)
      })

    })

  }

  startDHCP({ address, dhcpOpts, port }) {
    console.log('dhcp for', port)
    return new Promise((rs, rj) => {
      this.dhcpSvr = dhcp.createServer({
        // System settings
        range: ['10.10.11.50', '10.10.11.254'],
        //forceOptions: ['hostname'], // Options that need to be sent, even if they were not requested
        randomIP: true, // Get random new IP from pool instead of keeping one ip

        // Option settings (there are MUCH more)
        netmask: '255.255.0.0',
        router: [address],
        forceOptions: ['vendor','kernel','vendorClass'],
        // dns: ['8.8.8.8', '8.8.4.4'],
        hostname: 'maintenance-pc',
        broadcast: '255.255.255.255',
        server: address, // This is us,
        tftpServer: address,
        vendor: function (req, res) {
          if (dhcpOpts.vendor && typeof dhcpOpts.vendor == 'function') {
            return dhcpOpts.vendor(req, res);
          }
          return 'service-pc';
        },
        vendorClass: function(req, res){
          return port.toString()
        },
        kernel: function(req, res){
          return "krenelparams"
        },
        //bootFileSize: 672640,
        bootFile: function (req, res) {
          // res.ip - the actual ip allocated forW the client
          return '\\ipxe.efi\0';
        },
      });

      this.dhcpSvr
        .on('listening', () => {
          this.emit('dhcp.started');
          this.emit('listening');
          rs()
        })
        .on('error', (err: Error) => {
          console.log('dhcp err:',err)
        });

        this.dhcpSvr.listen(null, address);
    });
  }

  initDHCP() {
    dhcp.addOption(97, {
      config: 'ClientID',
      type: 'ASCII',
      name: 'UUID/GUID-based client identifier',
    });
    dhcp.addOption(43, {
      config: 'vendor',
      type: 'ASCII',
      name: 'deneme123',
    });
    dhcp.addOption(50, {
      // IP wish of client in DHCPDISCOVER
      name: 'Requested IP Address',
      type: 'IP',
      attr: 'requestedIpAddress',
      config: 'requestedIpAddress',
    });
    dhcp.addOption(60, {
      // RFC 2132: Sent by client to identify type of a client
      name: 'Vendor Class-Identifier',
      type: 'ASCII',
      attr: 'vendorClassId',
      config: 'vendorClassId',
    });
    dhcp.addOption(77, {
      config: 'userClass',
      type: 'UInt8s',
      name: 'userClass',
    });
    dhcp.addOption(93, {
      config: 'clientSystem',
      type: 'UInt8s',
      name: 'clientSystem',
    });
    dhcp.addOption(94, {
      config: 'clientNDI',
      type: 'UInt8s',
      name: 'clientNDI',
    });
    dhcp.addOption(124, {
      config: 'vendorClass',
      type: 'ASCII',
      name: 'vendorClass',
    });
    dhcp.addOption(129, {
      config: 'kernel',
      type: 'ASCII',
      name: 'kernel',
    });
    dhcp.addOption(175, {
      config: 'etherBoot',
      type: 'UInt8s',
      name: 'etherBoot',
    });
  }
  startTFTP({ address, port, root }) {
    return new Promise((rs, rj) => {
      this.tftpSvr = tftp
        .createServer({
          host: address,
          port: port,
          root: root,
          denyPUT: true,
        })
        .on('request', (req, res) => {
          req.on('error', (err) => {
            console.log('tftp req err', err)
          });
          console.log('tftp:', req.file);
        })
        .on('error', (err: any) => {
          console.log('tftp err', err);
        })
        .on('close', () => {
          //console.log('tftp stopped')
        })
        .on('listening', () => {
          this.emit('tftp.started');
          rs();
        });

        this.tftpSvr.listen();
    });
  }
}

export class PXEApi extends RouterAPI {
  pxe: PXEServer = new PXEServer();
  constructor() {
    super();
    this.post('/start', (req, res) => {
      this.pxe.start(req.body, (err) => {
        if (err) {
          console.log('pxe err', err);
          res.sendStatus(400);
        } else {
          res.sendStatus(200);
        }
      });
    });
    this.post('/stop', (req, res) => {
      this.pxe.stop((err) => {
        if (err) {
          res.sendStatus(400);
        } else {
          res.sendStatus(200);
        }
      });
    });
  }
}
