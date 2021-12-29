function InitGame(width, height, snakeLength, speed){
    return {
        clients: [],
        foods: [],
        settings: {
            width: width,
            height: height,
            snakeLength: snakeLength,
            speed: speed,
        },
        isAlive: true,
    }
}

function RandomPosition(set){
    let dir = {x: (Math.random() > 0.5)? 1 : -1, y: 0};
    let pos = [{x: 0, y: 0}];
    let w = set.width;
    let h = set.height;
    pos[0].y = Math.floor(Math.random() * (h));
    if(dir.x > 0){
        pos[0].x = Math.floor((Math.random() * (w/2 - set.snakeLength)) + set.snakeLength);
        for(let i = 1; i < set.snakeLength; ++i){
            pos.push({x: pos[i-1].x - 1, y: pos[0].y})
        }
    }else{
        pos[0].x = Math.floor((Math.random() * (w - set.snakeLength - w/2)) + w/2);
        for(let i = 1; i < set.snakeLength; ++i){
            pos.push({x: pos[i-1].x + 1, y: pos[0].y})
        }
    }
    return {direction: dir, positions: pos};
}

function AddPlayerInRoom(client, room){
    room.clients.push(client);
    RespawnPlayer(client, room.settings);
    RespawnFood(room);
}

function RespawnPlayer(client, settings){
    let pos_dir = RandomPosition(settings);
    client.direction = pos_dir.direction;
    client.snake = pos_dir.positions;
    client.score = 0;
    client.color = GetColor();
    client.isAlive = true;
    client.isUpdateDirection = false;
}

function RespawnFood(room){
    room.foods.push({x: Math.floor(Math.random() * room.settings.width), y: Math.floor(Math.random() * room.settings.height), score: 1, color: "red"});
}

function FoodKill(client, foods){
    foods.push({x: client.snake[1].x, y: client.snake[1].y, score: Math.floor(client.snake.length/2), color: "yellow"});
}

function UpdateDirection(client, code){
    if(!client.isUpdateDirection){
        switch(code){
            case 38:
            if(client.direction.y != 1){
                client.direction.x = 0;
                client.direction.y = -1;
            }
            break;
            case 39:
            if(client.direction.x != -1){
                client.direction.x = 1;
                client.direction.y = 0;
            }
            break;
            case 40:
            if(client.direction.y != -1){
                client.direction.x = 0;
                client.direction.y = 1;
            }
            break;
            case 37:
            if(client.direction.x != 1){
                client.direction.x = -1;
                client.direction.y = 0;
            }
            break;
        }
        client.isUpdateDirection = true;
    }
}

function KillPlayer(client, room, foods){
    client.isAlive = false;
    FoodKill(client, foods);
    setTimeout(RespawnPlayer, 3000, client, room.settings);
}

function GameLoop(room){
    let clients = room.clients;
    let foods = room.foods;
    for(let c = 0; c < clients.length; ++c){
        let client = clients[c];
        if(client.isAlive){
            for(let s = client.snake.length - 1; s > 0; --s){
                client.snake[s].x = client.snake[s-1].x;
                client.snake[s].y = client.snake[s-1].y;
            }
            client.snake[0].x += client.direction.x;
            client.snake[0].y += client.direction.y;
        }
    }
    for(let c = 0; c < clients.length; ++c){
        let client = clients[c];
        if(client.isAlive){
            if(client.snake[0].x < 0 || client.snake[0].x >= room.settings.width ||
                client.snake[0].y < 0 || client.snake[0].y >= room.settings.height){
                    client.isAlive = false;
                    FoodKill(client, foods);
                    setTimeout(RespawnPlayer, 3000, client, room.settings);
            }
        }
    }

    for(let c1 = 0; c1 < clients.length; ++c1){
        let client1 = clients[c1];
        if(client1.isAlive){
            for(let c2 = 0; c2 < clients.length; ++c2){
                let client2 = clients[c2];
                if(client2.isAlive){
                    let i = 0;
                    if(c1 === c2){
                        i = 4;
                    }
                    if(client1.snake[0].x === client2.snake[1].x && client1.snake[0].y === client2.snake[1].y &&
                        client2.snake[0].x === client1.snake[1].x && client2.snake[0].y === client1.snake[1].y){
                        KillPlayer(client1, room, foods);
                        KillPlayer(client2, room, foods);
                    }else{
                        for(;i < client2.snake.length; ++i){
                            if(client1.snake[0].x === client2.snake[i].x && client1.snake[0].y === client2.snake[i].y){
                                KillPlayer(client1, room, foods);
                                if(i === 0){
                                    KillPlayer(client2, room, foods);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    for(let c = 0; c < clients.length; ++c){
        let client = clients[c];
        if(client.isAlive){
            for(let f = 0; f < foods.length; ++f){
                if(client.snake[0].x === foods[f].x && client.snake[0].y === foods[f].y){
                    let snake = client.snake;
                    client.score += foods[f].score;
                    for(let k = 0; k < foods[f].score; ++k){
                        snake.push({x: snake[snake.length - 1].x, y: snake[snake.length - 1].y});
                    }
                    if(foods[f].score === 1){
                        RespawnFood(room);
                    }
                    foods.splice(f, 1);
                }
            }
        }
    }

    let stategame = {players: [], foods: room.foods};
    for(let c = 0; c < clients.length; ++c){
        let client = clients[c];
        if(client.isAlive){
            stategame.players.push({snake: client.snake, score: client.score, color: client.color, nickname: client.nickname}); 
        }
    }

    for(let c = 0; c < clients.length; ++c){
        clients[c].isUpdateDirection = false;
    }

    return stategame;
}

function GetColor(){
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function CreateCode(length){
    const words = "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
    let result = "";
    for(let i = 0; i < length; ++i){
        result += words[Math.floor(Math.random()*(words.length - 1))]
    }
    return result;
}

module.exports = {
    InitGame,
    AddPlayerInRoom,
    CreateCode,
    GameLoop,
    UpdateDirection,
}