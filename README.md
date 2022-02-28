# node-command-tools
cpuinfo/IP address/Ping another web url/wifi controller

Install

```
npm install node-command-tools --dev
```

Getting Start

```javascript
const { GetProcessorID, GetCpuInfo, Ping, GetIp, NetSh } = require("node-system");

// cup serial number
GetProcessorID().then(cupid => {
    console.log(cupid)
})
// cup information
GetCpuInfo().then(cupinfo => {
    console.log(cupinfo);
})

// network latency
const pingClient = Ping("www.baidu.com");
pingClient().then(val => {
    console.log(val)
}).catch(err => {
    console.log(err)
})

// ip address
GetIp().then(val => {
    console.log(123,val) 
})   

// wifi controll
const net_shell = NetSh();
net_shell.scan().then(list => {
    console.log('networks:', list)
})
net_shell.currentConnect().then(val => {
    console.log('currentConnect', val)
})
net_shell.disconnect().then(val => {
    console.log(val.length)
    if (!val) {
        console.log("断开失败")
    } else {
        console.log(val)
    }clear
})
net_shell.connnect({ ssid: 'ssid', password: 'password' }, 
function success(text) {
    console.log(text)
},
function error (err) {
    console.log(err)
}
)
```
