# node-command-tools
cpuinfo/IP address/Ping another web url/wifi controller

```javascript
const { GetProcessorID, GetCpuInfo, Ping, GetIp, NetSh } = require("node-system");
GetProcessorID().then(cupid => {
    console.log(cupid)
})

GetCpuInfo().then(cupinfo => {
    console.log(cupinfo);
})
const pingClient = Ping("www.baidu.com");
pingClient().then(val => {
    console.log(val)
}).catch(err => {
    console.log(err)
})
GetIp().then(val => {
    console.log(123,val) 
})   

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
