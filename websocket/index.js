const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

app.get('/', (req, res) => {
  res.send('Listening');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('code', e => {
    socket.broadcast.emit('code', e)
  })

  socket.on('cursorPos', e => {
    socket.broadcast.emit('cursorPos', e)
  })

});

server.listen(3001, () => {
  console.log('listening on *:3001');
});