

const { exec, execFile } = require("child_process");
const iconv = require('iconv-lite');
const { Commands, Command_ExecFile } = require("./lib/commands")
const { CallbackFormatterGen, Validate, utils } = require("./lib/utils")
const { NOOP, VALACROSS, PROFILENAME } = require("./lib/state")
const path = require('path');
const fs = require("fs");
const profilePath = path.join(require('os').tmpdir(), PROFILENAME)

process.on("uncaughtException", (err) => {
    console.log(1123, err)
})

const ExecCore = (command, formatter) => {
    return (resolve, reject) => {
        exec(command, { encoding: 'buffer' }, (error, stdout, stderr) => {
            if (error) {
                reject(error)
                return;
            }
            resolve(formatter(iconv.decode(stdout, 'cp936')))
        })
    }
}

const ExecFileCore = (command, formatter, charset = 'cp936') => {
    return (resolve, reject) => {
        const Callback = (err, stdout) => {
            if (err) {
                reject(err);
                return
            };
            resolve(formatter({
                stdout: iconv.decode(stdout, charset),
                buffer: stdout
            }))
        };
        command.push(Callback);
        execFile.apply(null, command)
    }
}
const ExceFileCaller = (command, formatter, charset) => ({
    then: ExecFileCore(command, formatter, charset)
})

const PromiseShell = (thenable) => {
    if (Validate.isObject(thenable) && Validate.isFunction(thenable.then)) {
        return Promise.resolve(thenable)
    } else {
        throw Error("PromiseShell params 1 must include thenable object")
    }
}

const ExecCaller = (command, formatter) => ({
    then: ExecCore(command, formatter)
})

// Command ExceFile Function Modules
const scan = () => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellScan, CallbackFormatterGen('NETHSSCAN')))
}

const currentConnect = () => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellCurrentConnect, CallbackFormatterGen('NETHSCONNECT')))
}

const disconnect = () => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellDisconnect, CallbackFormatterGen('NETHSDISCONNECT')))
}

const _connect = () => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellConnect(profilePath), CallbackFormatterGen('PRAVITECONNECT')))
}

const connnect = async (config = {}) => {
    const { ssid, password } = config;
    if (!ssid && !password) {
        throw new Error("connect method param config must include ssid and password")
    }
    console.log(profilePath)
    // TODO尝试链接  
    // let connectStatus = await _connect();
    // console.log(connectStatus)
    
    // return
    // DONE 没连上 写入wifi配置文件
    let wifiList = await scan();
    console.log(wifiList.map( o => o.SSID));
    const target = wifiList.find(o => o.SSID == config.ssid);
    if (!target) throw Error("can not found SSID:" + config.ssid);
    fs.writeFileSync(profilePath, utils.win32WirelessProfileBuilder(target, config.password))
}
const NetSh = () => {
    return { scan, currentConnect, disconnect, connnect }
}

// Command Function Modules
const GetProcessorID = (command) => {
    return () => PromiseShell(ExecCaller(command, CallbackFormatterGen('CUPID')))
}

const GetCpuInfo = (command) => {
    return () => PromiseShell(ExecCaller(command, CallbackFormatterGen('CUPINFO')))
}

const GetPING = (command) => {
    return () => PromiseShell(ExecCaller(command, CallbackFormatterGen('NETWORKPING')))
}

const GetIp = (command) => {
    return () => Promise.resolve(ExecCaller(command, VALACROSS))
}

module.exports = {
    GetProcessorID: GetProcessorID(Commands.ProcessorID),
    GetCpuInfo: GetCpuInfo(Commands.CUPINFO),
    Ping: (url) => {
        return GetPING(Commands.PING + url)
    },
    GetIp: GetIp(Commands.LOACLIP),
    NetSh
}