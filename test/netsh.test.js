const { NetSh } = require("../src/node-system");
const TestSh = NetSh();

test('scan', () => {
    expect(TestSh.scan)
})
test('connect', () => {
    expect(TestSh.connnect)
})
test('disconnect', () => {
    expect(TestSh.disconnect)
})
test('currentConnect', () => {
    expect(TestSh.currentConnect)
})
