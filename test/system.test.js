const { GetProcessorID, GetCpuInfo, Ping, GetIp } = require("../src/node-system");
test('GetProcessorID', () => {
    expect(GetProcessorID)
})
test('GetCpuInfo', () => {
    expect(GetCpuInfo)
})
test('Ping', () => {
    expect(Ping)
})
test('GetIp', () => {
    expect(GetIp)
})