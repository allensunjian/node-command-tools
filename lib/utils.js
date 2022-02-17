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
        return 
    },
    NETHSSCAN: function (val) {
        const retList = val.replace(/\r/g, '').split('\n')
        const SSIDList = retList.filter( info => info.indexOf('SSID') >= 0);
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
    NETHSCONNECT: function parseShowInterfaces(stdout) {
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