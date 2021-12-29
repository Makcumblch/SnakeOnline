const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const { PORT, LENGTH_CODE, MIN_GRID_SIZE_X, MIN_GRID_SIZE_Y, MIN_SNAKE_LENGTH } = require('./constants');
const { InitGame, AddPlayerInRoom, CreateCode, GameLoop, UpdateDirection } = require('./game')

const server = express()
  .use('/', express.static(path.join(__dirname, 'frontend')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const wss = new WebSocket.Server({server});

let clientsRooms = {};

function Close(client){
  if(clientsRooms[client.codeRoom]){
    if(client.isOwner){
      for(let i = 1; i < clientsRooms[client.codeRoom].clients.length; ++i){
        clientsRooms[client.codeRoom].clients[i].send(JSON.stringify({event: "close"}));
      }
      delete clientsRooms[client.codeRoom];
    }else{
      let clients = clientsRooms[client.codeRoom].clients;
      clients.splice(clients.indexOf(client, 1));
    }
  }
}

wss.on("connection", client => {
  client.on('message', message => {
    let mes = JSON.parse(message);
    switch(mes.event){
      case "createRoom":
        let codeRoom = CreateCode(LENGTH_CODE);
        client.codeRoom = codeRoom;
        client.nickname = mes.data.nickname;
        client.isOwner = true;
        if(mes.data.width < MIN_GRID_SIZE_X){
          mes.data.width = MIN_GRID_SIZE_X;
        }
        if(mes.data.height < MIN_GRID_SIZE_Y){
          mes.data.height = MIN_GRID_SIZE_Y;
        }
        if(mes.data.snakeLength < MIN_SNAKE_LENGTH){
          mes.data.snakeLength = MIN_SNAKE_LENGTH;
        }
        if(mes.data.speed <= 0){
          mes.data.speed = 1;
        }
        clientsRooms[codeRoom] = InitGame(mes.data.width,mes.data.height,mes.data.snakeLength, mes.data.speed);
        AddPlayerInRoom(client, clientsRooms[codeRoom]);
        client.send(JSON.stringify({event: "init", data: {codeRoom: codeRoom, settings: clientsRooms[codeRoom].settings}}));
        let timerId = setInterval(() => {
          if(clientsRooms[codeRoom]){
            let stategame = GameLoop(clientsRooms[codeRoom]);
            for(let i = 0; i < clientsRooms[codeRoom].clients.length; ++i){
              clientsRooms[codeRoom].clients[i].send(JSON.stringify({event: "stategame", data: {your_pos: {x: clientsRooms[codeRoom].clients[i].snake[0].x, y: clientsRooms[codeRoom].clients[i].snake[0].y},stategame: stategame}}));
            }
          }else{
            clearInterval(timerId);
          }
        }, 1000/mes.data.speed);
      break;

      case "enterRoom":
        if(clientsRooms[mes.data.roomName]){
          AddPlayerInRoom(client, clientsRooms[mes.data.roomName]);
          client.codeRoom = mes.data.roomName;
          client.nickname = mes.data.nickname;
          client.isOwner = false;
          client.send(JSON.stringify({event: "init", data: {codeRoom: mes.data.roomName, settings: clientsRooms[mes.data.roomName].settings}}));
        }
      break;

      case "keydown":
        UpdateDirection(client, mes.data);
      break;
      case "close":
        Close(client);
      break;
    }
  });

  client.on('close', () => {
    Close(client);
  });
});