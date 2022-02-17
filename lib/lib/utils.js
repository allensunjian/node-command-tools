const  { NOOP, VALACROSS } = require("./state")
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
    stringParser_common (str, condition, filterKey = VALACROSS, filterVal = VALACROSS) {
        const arr = str.split(condition);
        return {
            [filterKey(arr[0])]: filterVal(arr[1])
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
        let profile_content = `<?xml version="1.0"?> <WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"> <name>${
          selectedAp.ssid
        }</name> <SSIDConfig> <SSID> <hex>${getHexSsid(
          selectedAp.ssid
        )}</hex> <name>${selectedAp.ssid}</name> </SSID> </SSIDConfig>`;
      
        if (selectedAp.security.includes('WPA2')) {
          profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPA2PSK</authentication> <encryption>AES</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${key}</keyMaterial> </sharedKey> </security> </MSM>`;
        } else if (selectedAp.security.includes('WPA')) {
          profile_content += `<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPAPSK</authentication> <encryption>TKIP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>${key}</keyMaterial> </sharedKey> </security> </MSM>`;
        } else {
          if (selectedAp.security_flags.includes('WEP')) {
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
        return  val.reduce((ref, cur) => {
            if (!utils.isEmpty(cur)) {
                const ret = utils.stringParser(cur)
                ref[ret.key] = ret.value;
            }
            return ref
        }, {}) 
    },
    NETWORKPING: function (val) {
        val = utils.scrubbing(val)
        const arr = val.filter( str => str !== '');
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
        const SSIDList = val.replace(/\r/g, '').split('\n').slice(4)
        const FilterKey = () => {
            return "SSID"
        }
        const FilterVal = (val) => {
            return val.replace(new RegExp(" ", 'g'), "")
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
                        const head = utils.stringParser_common(sliceArr[0], ":", FilterKey, FilterVal);
                        head.modes = sliceArr
                        .slice(1)
                        .map(str => FilterVal(str.slice(str.indexOf(":") + 1)))
                        retInfoList.push(head);
                        current = i;
                    }
                }
                for(let i = 0; i < SSIDList.length; i++ ) {
                    const item = SSIDList[i];
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
    NETHSCONNECT: function (stdout) {
        const lines = stdout.split('\r\n');
        const connections = [];
        let i = 3;
        while (lines.length > i + 18) {
          const tmpConnection = {};
          const fields = [
            'name',
            'description',
            'guid',
            'mac',
            'state',
            'ssid',
            'bssid',
            'mode',
            'radio',
            'authentication',
            'encryption',
            'connection',
            'channel',
            'reception',
            'transmission',
            'signal',
            'profil'
          ];
          for (let j = 0; j < fields.length; j++) {
            const line = lines[i + j];
            tmpConnection[fields[j]] = line.match(/.*: (.*)/)[1];
          }
      
          connections.push({
            iface: tmpConnection.name,
            ssid: tmpConnection.ssid,
            bssid: tmpConnection.bssid,
            mac: tmpConnection.bssid,
            mode: tmpConnection.mode,
            channel: parseInt(tmpConnection.channel),
            quality: parseFloat(tmpConnection.signal),
            security: tmpConnection.authentication,
            security_flags: tmpConnection.encryption
          });
      
          i = i + 18;
        }
        return connections;
    },
    NETHSDISCONNECT: function (val) {
        return val.replace(/\r|\n/g, "")
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
    utils
}