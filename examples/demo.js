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
net_shell.currentConnect().then(val => {
    console.log(val)
})