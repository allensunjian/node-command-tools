const Commands = {
    ProcessorID: 'wmic cpu get ProcessorID',
    CUPINFO: "wmic cpu list full",
    PING: "ping ",
    LOACLIP: "ipconfig"
}

const env = {
    ...process.env,
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    LC_MESSAGES: 'en_US.UTF-8'
}
const encoding = "buffer";

const mergeWithEqual = (key, val) => `${key}=${val}`
/**
 * mode and key derctive
 */
const NETSHELL = 'netsh';
const WLAN = 'wlan';
const NETWORKS = 'networks';
const MODE = 'mode';
const SHOW = 'show';
const INTERFACES = 'interfaces';
const DISCONNECT = 'disconnect';

/**
 * value derctive
 */
const VAL_SSID = 'Bssid';

const Command_ExecFile = {
    NetShellScan: [NETSHELL, [ WLAN, SHOW, NETWORKS, mergeWithEqual(MODE, VAL_SSID)], { env, encoding }],
    NetShellCurrentConnect: [NETSHELL, [ WLAN, SHOW, INTERFACES ], { env, encoding }],
    NetShellDisconnect: [ NETSHELL, [ WLAN, DISCONNECT ], { env, encoding }]
}

module.exports = {
    Commands,
    Command_ExecFile
}