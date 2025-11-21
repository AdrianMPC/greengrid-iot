const aedes = require('aedes')();
const net = require('net');

const PORT = 1883;

const server = net.createServer(aedes.handle);

server.listen(PORT, () => {
  console.log(`🚀 MQTT Broker corriendo en mqtt://localhost:${PORT}`);
});
