

const { exec, execFile } = require("child_process");
const iconv = require('iconv-lite');
const { Commands, Command_ExecFile } = require("./lib/commands")
const { CallbackFormatterGen, Validate, utils } = require("./lib/utils")
const { NOOP, VALACROSS, PROFILENAME } = require("./lib/state")
const path = require('path');
const fs = require("fs");
const profilePath = path.join(require('os').tmpdir(), PROFILENAME)

const ExecCore = (command, formatter) => {
    return (resolve, reject) => {
        try {
            exec(command, { encoding: 'buffer' }, (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                    return;
                }
                resolve(formatter(iconv.decode(stdout, 'cp936')))
            })
        } catch (error) {
            // dosome... have nothing idea
            reject("Unknown error")
        }

    }
}
process.on("uncaughtException", err => {
    console.log(err)
})
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
        try {
            execFile.apply(null, command)
        } catch (error) {
            // dosome... have nothing idea
            reject("Unknown error")
        }

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

const _appendConfigToSetting = (profilePath) => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellConnect(profilePath), CallbackFormatterGen('PRAVITECONNECT')))
}

const _connect = (ssid) => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetShellConnectFinall(ssid), CallbackFormatterGen('PRAVITECONNECTFINALL')))
}

const _delProFile = (ssid) => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetProFileDel(ssid), CallbackFormatterGen('PRAVITECONNECTFINALL')))
}
const _connectedEnd = (ssid) => {
    return PromiseShell(ExceFileCaller(Command_ExecFile.NetProFileEnd(ssid), CallbackFormatterGen('PRAVITECONNECTFINALL')))
}

const connnect = async (config = {}, Callback = NOOP, Catch = NOOP) => {
    const { ssid, password } = config;
    if (!ssid && !password) {
        throw new Error("connect method param config must include ssid and password")
    }
    try {
        let wifiList = await scan();
        const target = wifiList.find(o => o.SSID == config.ssid);
        if (!target) {
            Catch("can not found SSID:" + config.ssid);
            return
        }

        fs.writeFileSync(profilePath, utils.win32WirelessProfileBuilder(target, config.password))
        // todo connect taget ssid

        let connectStatus = await _appendConfigToSetting(profilePath);
        if (connectStatus) {
            const state = await _connect(config.ssid);
            if (state) { Callback(state) } else Catch("unknown error")
            _connectedEnd(config.ssid);
        } else Catch("unknown error");
    } catch (error) {
        Catch('unknown error');
        _delProFile()
    }
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
    NetSh,
    Command (command) {
        return () => PromiseShell(ExecCaller(command, val => val))
    }
}