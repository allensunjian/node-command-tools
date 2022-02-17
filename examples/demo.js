const { GetProcessorID, GetCpuInfo, Ping, GetIp, NetSh } = require("../lib/node-system");
// GetProcessorID().then(cupid => {
//     console.log(cupid)
// })

// GetCpuInfo().then(cupinfo => {
//     console.log(cupinfo);
// })
// const pingClient = Ping("www.baidu.com");
// pingClient().then(val => {
//     console.log(val)
// }).catch(err => {
//     console.log(err)
// })
// GetIp().then(val => {
//     console.log(123,val)
// })

const net_shell = NetSh();
net_shell.scan().then(list => {
    console.log(list)
})
// net_shell.currentConnect().then(val => {
//     console.log(val)
// })
// net_shell.disconnect().then(val => {
//     console.log(val.length)
//     if (!val) {
//         console.log("断开失败")
//     } else {
//         console.log(val)
//     }
// })
// net_shell.connnect({ssid: '痘博士_5G', password: 'douboshi'})