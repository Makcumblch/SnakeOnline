const createRoom = document.getElementById("createRoom");
const roomNameInput = document.getElementById("roomNameInput");
const enterRoom = document.getElementById("enterRoom");
const canvas = document.getElementById("canvas");
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const disconnect = document.getElementById("disconnect");
const codeRoom = document.getElementById("codeRoom");
const gridWidth = document.getElementById("gridWidth");
const gridHeigth = document.getElementById("gridHeigth");
const snakeLength = document.getElementById("snakeLength");
const speedGame = document.getElementById("speedGame");
const nickname = document.getElementById("nickname");
const leaders = document.getElementById("leaders");

const HOST = location.origin.replace(/^http/, 'ws')
const socket = new WebSocket(HOST);

const ctx = canvas.getContext('2d');
let GRID_SIZE_X = 0;
let GRID_SIZE_Y = 0;
const CELL_SIZE = 16;
let connected = false;

socket.onopen = () => {
    console.log("Соединение установлено.");
    connected = true;
};

socket.onclose = function(event) {
    connected = false;
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
};

socket.onmessage = function(message) {
    let mes = JSON.parse(message.data);
    switch(mes.event){
        case "init":
            Init(mes.data);
        break;
        case "stategame":
            Draw(mes.data);
            UpdateLeaders(mes.data);
        break;
        case "close":
            ChangePage();
        break;
    }
};

createRoom.addEventListener("click", () => {
    if(connected){
        socket.send(JSON.stringify({event: "createRoom", data: {nickname: nickname.value, width: gridWidth.value, height: gridHeigth.value, snakeLength: snakeLength.value, speed: speedGame.value}}));
    }
});

enterRoom.addEventListener("click", () => {
    if(roomNameInput.value !== "" && connected){
        socket.send(JSON.stringify({event: "enterRoom", data: {nickname: nickname.value, roomName: roomNameInput.value}}));
    }
});

disconnect.addEventListener("click", () => {
    socket.send(JSON.stringify({event: "close"}));
    ChangePage()
});

addEventListener("keydown", function(event) {
    if (event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40 || event.keyCode == 37){
        socket.send(JSON.stringify({event: "keydown", data: event.keyCode}));
    }
});

function ChangePage(){
    menu.classList.toggle("hidden");
    game.classList.toggle("hidden");
}

function Init(data){
    GRID_SIZE_X = data.settings.width;
    GRID_SIZE_Y = data.settings.height; 
    codeRoom.textContent = "Код комнаты: " + data.codeRoom;
    ChangePage();
}

function UpdateLeaders(data){
    let players = data.stategame.players;
    players.sort((prev, next) => next.score - prev.score);

    leaders.innerHTML = "";
    for(let i = 0; i < players.length; ++i){
        let l = document.createElement('li');
        l.style.color = players[i].color;
        l.innerText = players[i].nickname + " - " + players[i].score;
        leaders.appendChild(l);
    }
}

function Draw(data){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let X = data.your_pos.x * CELL_SIZE - Math.floor(canvas.width/2);
    let Y = data.your_pos.y * CELL_SIZE - Math.floor(canvas.height/2);

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.moveTo(- X, -Y);
        ctx.lineTo(- X, GRID_SIZE_Y * CELL_SIZE - Y);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.moveTo(GRID_SIZE_X * CELL_SIZE - X, -Y);
        ctx.lineTo(GRID_SIZE_X * CELL_SIZE - X, GRID_SIZE_Y * CELL_SIZE - Y);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.moveTo(-X, - Y);
        ctx.lineTo(GRID_SIZE_X * CELL_SIZE - X, - Y);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.moveTo(-X, GRID_SIZE_Y * CELL_SIZE - Y);
        ctx.lineTo(GRID_SIZE_X * CELL_SIZE - X, GRID_SIZE_Y * CELL_SIZE - Y);
        ctx.stroke();

    for(let f = 0; f < data.stategame.foods.length; ++f){
        let food = data.stategame.foods[f];
        ctx.fillStyle = food.color;
        ctx.fillRect(food.x * CELL_SIZE - X, food.y * CELL_SIZE - Y, CELL_SIZE, CELL_SIZE)
    }
    for(let p = 0; p < data.stategame.players.length; ++p){
        let player = data.stategame.players[p];
        ctx.fillStyle = player.color;
        for(let s = 0; s < player.snake.length; ++s){
            let c = player.snake[s];
            ctx.fillRect(c.x * CELL_SIZE - X, c.y * CELL_SIZE - Y, CELL_SIZE, CELL_SIZE);
        }
    }
}
