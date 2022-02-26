const { NOOP, VALACROSS } = require("./state")

class Enumerator {
    constructor(object) {
        if (object && typeof object == 'object') {
            this.orign = object;
            this.keys = [];
            this.vals = [];

        } else {
            throw Error('Enumerator params 1 must be object')
        }
        this.gen(object)
    }
    gen() {
        Object.keys(this.orign).forEach(key => {
            this.keys.push(key);
            this.vals.push(this.orign[key]);
        })
    }
    get(keyword) {
        const keyIndex = this.keys.indexOf(keyword);
        const valIndex = this.vals.indexOf(keyword);
        if (keyIndex >= -1 && valIndex >= -1) {
            return null
        } else {
            if (keyIndex) {
                return this.vals[keyIndex]
            } else {
                return this.vals[valIndex]
            }
        }
    }
}

const ClassGen = {
    Enumerator
}

const utils = {
    scrubbing: (val) => {
        return val.toString('utf8')
            .split('\r')
            .join('')
            .split('\n');
    },
    scrubbing_space: (val) => {
        return val.replace(new RegExp(" ", "g"), '')
    },
    isEmpty: (val) => {
        return val == "" || val == null || val == undefined
    },
    stringParser: (str) => {
        const arr = str.split("=");
        return {
            key: arr[0],
            value: arr[1]
        }
    },
    stringParser_common(str, condition, filterKey = VALACROSS, filterVal = VALACROSS) {
        const arr = str.split(condition);
        return {
            [filterKey(arr[0])]: filterVal(arr.slice(1).join(':'))
        }
    },
    win32WirelessProfileBuilder: function (selectedAp, key) {
        const getHexSsid = (plainTextSsid) => {
            let i, j, ref, hex;
            hex = '';
            for (
                i = j = 0, ref = plainTextSsid.length - 1;
                ref >= 0 ? j <= ref : j >= ref;
                i = ref >= 0 ? ++j : --j
            ) {
                hex += plainTextSsid.charCodeAt(i).toString(16);
            }
            return hex;
        }
        const security = ((map) => {
            const valHash = 
            Object.keys(map)
            .reduce((ref, cur) => {
                return ref += typeof map[cur] == "string" ? map[cur] : ""
            }, "");
            let includes = (val) => {
                return valHash.indexOf(val) >= 0
            }
            return {
                includes
            }
        })(selectedAp)

        let profile_content = `<?xml version="1.0"?> <WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"> <name>${selectedAp.SSID
            }</name> <SSIDConfig> <SSID> <hex>${getHexSsid(
                selectedAp.SSID
            )}</hex> <name>${selectedAp.SSID}</name> </SSID> </SSIDConfig>`;

        if (security.includes('WPA2')) {
            profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPA2PSK</authentication> <encryption>AES</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${key}</keyMaterial> </sharedKey> </security> </MSM>`;
        } else if (security.includes('WPA')) {
            profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPAPSK</authentication> <encryption>TKIP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${key}</keyMaterial> </sharedKey> </security> </MSM>`;
        } else {
            if (security.includes('WEP')) {
                profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>open</authentication> <encryption>WEP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>networkKey</keyType> <protected>false</protected> <keyMaterial>${key}</keyMaterial> </sharedKey> </security> </MSM>`;
            } else {
                profile_content +=
                    '<connectionType>ESS</connectionType> <connectionMode>manual</connectionMode> <MSM> <security> <authEncryption> <authentication>open</authentication> <encryption>none</encryption> <useOneX>false</useOneX> </authEncryption> </security> </MSM>';
            }
        }
        profile_content += '</WLANProfile>';
        return profile_content;
    },
    parse: (networkTmp) => {
        const network = {};
        network.mac = networkTmp[4] ? networkTmp[4].match(/.*?:\s(.*)/)[1] : '';
        network.bssid = network.mac;
        network.ssid = networkTmp[0] ? networkTmp[0].match(/.*?:\s(.*)/)[1] : '';
        network.channel = networkTmp[7]
            ? parseInt(networkTmp[7].match(/.*?:\s(.*)/)[1])
            : -1;
        network.frequency = network.channel
            ? parseInt(networkUtils.frequencyFromChannel(network.channel))
            : 0;
        network.signal_level = networkTmp[5]
            ? networkUtils.dBFromQuality(networkTmp[5].match(/.*?:\s(.*)/)[1])
            : Number.MIN_VALUE;
        network.quality = networkTmp[5]
            ? parseFloat(networkTmp[5].match(/.*?:\s(.*)/)[1])
            : 0;
        network.security = networkTmp[2] ? networkTmp[2].match(/.*?:\s(.*)/)[1] : '';
        network.security_flags = networkTmp[3]
            ? networkTmp[3].match(/.*?:\s(.*)/)[1]
            : '';
        network.mode = 'Unknown';

        return network;
    }
};
const FormatterLib = {
    CUPID: function (val) {
        val = utils.scrubbing(val);
        const s = utils.scrubbing_space;
        return {
            [s(val[0])]: s(val[1])
        }

    },
    CUPINFO: function (val) {
        val = utils.scrubbing(val);
        return val.reduce((ref, cur) => {
            if (!utils.isEmpty(cur)) {
                const ret = utils.stringParser(cur)
                ref[ret.key] = ret.value;
            }
            return ref
        }, {})
    },
    NETWORKPING: function (val) {
        val = utils.scrubbing(val)
        const arr = val.filter(str => str !== '');
        const last = arr.pop();
        return last.split("，").reduce((ref, cur) => {
            if (!utils.isEmpty(cur)) {
                const ret = utils.stringParser(utils.scrubbing_space(cur))
                ref[ret.key] = ret.value;
            }
            return ref
        }, {})
    },
    LOACLIP: function (val) {
        return val
    },
    NETHSSCAN: function (val) {
        const stringUtf8 = val.buffer.toString('utf8');
        val = val.stdout; // chartset cp396
        const SSIDList_UTF8 = stringUtf8.replace(/\r/g, '').split('\n').slice(4);
        const SSIDList = val.replace(/\r/g, '').split('\n').slice(4);
        const FIXEDKEY = (key) => () => key
        const FilterVal = (val = "") => {
            return val.replace(new RegExp(" ", 'g'), "")
        };
        const BSSID = 'BSSID';
        // const Em = new Enumerator({
        //     channel: '频道',
        //     security_flags: '加密',
        //     quality: '信号',
        //     security: '身份验证',

        // });
        const mergeHeadAndBody = (head, body) => {
            const keys = Object.keys(body);
            const attrs = keys.slice(0, 3); 
            const dynamic_attrs = keys.slice(3);
            attrs.forEach(attr => head[attr] = body[attr][0]);
            head.BSSID_INFO = [];
            (dynamic_attrs || []).forEach(dynamicKey => {
                (body[dynamicKey] || []).forEach((val, index) => {
                    const ref = head.BSSID_INFO[index]
                    if (ref) {
                        ref[dynamicKey] = val;
                    } else {
                        head.BSSID_INFO[index] = {
                            [dynamicKey]: val
                        };
                    }
                })
            });
            return head
        }
        const cutList = (key) => {
            const GetKeyInContent = (key) => {
                const retIndex = [];
                const retInfoList = [];
                let current = 0;
                retIndex.__proto__.handlePush = function (i) {
                    Array.prototype.push.call(retIndex, i);
                    if (retIndex.length >= 2) {
                        const sliceArr = SSIDList.slice(current, i);
                        const headSliceArr = SSIDList_UTF8.slice(current, i);
                        const head = utils.stringParser_common(headSliceArr[0], ":", FIXEDKEY('SSID'), FilterVal);
                        let repeatMap = {};
                        sliceArr.slice(1).forEach(info => {
                            let key, val;
                            utils.stringParser_common(info, ":",
                                _key => {
                                    key = FilterVal(_key);
                                    if (key.indexOf(BSSID) >= 0) key = BSSID;
                                    if (!repeatMap[key]) repeatMap[key] = []
                                },
                                _val => {
                                    if (repeatMap[key]) repeatMap[key].push(FilterVal(_val))
                                }
                            )
                        });
                        retInfoList.push(mergeHeadAndBody(head, repeatMap));
                        current = i;
                    }
                }
                for (let i = 0; i < SSIDList_UTF8.length; i++) {
                    const item = SSIDList_UTF8[i];
                    const index = item.indexOf(key);
                    const index1 = item.indexOf('BSSID');
                    if (index >= 0 && index1 == -1) {
                        retIndex.handlePush(i);
                    }
                };
                return retInfoList
            }
            return GetKeyInContent(key);
        }
        return cutList('SSID')
    },
    NETHSCONNECT: function (val) {
        val = val.stdout;
        let ret = {};
        const List = val.replace(/\r/g, '').split('\n').filter(text => text !== '').slice(1);
        const FilterVal = (val = "") => {
            return val.replace(new RegExp(" ", 'g'), "")
        };
        List.forEach( text => {
            ret = Object.assign(ret, utils.stringParser_common(text,  ":", FilterVal, FilterVal))
        });
        if (!!!ret.SSID) {
            ret = null
        }
        return ret

    },
    NETHSDISCONNECT: function (val) {
        val = val.stdout;
        return val.replace(/\r|\n/g, "")
    },
    PRAVITECONNECT: function (val) {
        return val.stdout
    },
    PRAVITECONNECTFINALL: function (val) {
        return val.stdout
    }
};

const TypeStringCaller = (tar, type) => {
    const baseTypeStr = Object.prototype.toString.call(tar).replace(/\[|\]|\'/g, '');
    const retType = baseTypeStr.split(" ")[1]
    if (typeof type == "string") {
        type = type.toUpperCase();
        return retType.toUpperCase() == type
    };
    return retType
}

const Validate = {
    isFunction: (tar) => {
        return typeof tar == 'function'
    },
    isObject: (tar) => {
        return TypeStringCaller(tar, "object")
    }
}

const CallbackFormatterGen = (str) => (val) => {
    const F = FormatterLib[str];
    if (!val) return val;
    if (!F) return VALACROSS(val);
    return F(val)
}

module.exports = {
    CallbackFormatterGen,
    Validate,
    utils,
    ClassGen
}