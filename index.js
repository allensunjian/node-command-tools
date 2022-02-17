

const { exec, execFile } = require("child_process");
const iconv = require('iconv-lite');
const { Commands, Command_ExecFile } = require("./lib/commands")
const { CallbackFormatterGen, Validate, utils } = require("./lib/utils")
const  { NOOP, VALACROSS } = require("./lib/state")

process.on("uncaughtException", (err) => {
    console.log(1123,err)
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

const ExecFileCore = (command, formatter) => {
    return (resolve, reject) => {
        const Callback = (err, stdout) => {
            if (err) {
                reject(err);
                return
            };
            resolve(formatter(iconv.decode(stdout, 'cp936')))
        };
        command.push(Callback)
        execFile.apply(null, command)
    }
}
const ExceFileCaller = (command, formatter) => ({
    then: ExecFileCore(command, formatter)
})

const PromiseShell = (thenable) => {
    if ( Validate.isObject(thenable) && Validate.isFunction(thenable.then) ) {
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

const NetSh = () => {
    return {
        scan,
        currentConnect
    }
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