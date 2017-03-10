var request = require('request');
var mineflayer = require('mineflayer');
var readlineSync = require('readline-sync');

var API_TOKEN = readlineSync.question('What is your Telegram API Token?\n');

var BASE_URL = "https://api.telegram.org/bot{{token}}".replace("{{token}}", API_TOKEN);

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

var Client = function(id){
    this.id = id;
    this.chat_id = -1;
    this.username = null;
    this.password = null;
    this.ip = null;
    this.port = null;
    this.health = 20;

    this.bot = null;
    this.connect = () => {
        this.bot = mineflayer.createBot({
            host: this.ip,
            port: this.port,
            username: this.username,
            // password: this.password,
            verbose: true,
            version : '1.8'
        });

        var bot = this.bot;
        var chat_id = this.chat_id;
        var client = this;

        this.bot.on('login', function() {
            sendHTMLResponse("<i>" + bot.username + " joined the game</i>", chat_id);
        });

        this.bot.on('spawn', function() {
            // sendTextResponse("Spawn Success!", chat_id);
            // bot.chat("I spawned, watch out!");
            client.health = 20;
        });

        // this.bot.on('entityHurt', function(entity) {
        //     if(entity.username == bot.username) {
        //         sendHTMLResponse("<i>You received " + (bot.health - entity.health) + " damage. HP: " + bot.health + "/20</i>", chat_id);
        //     }
        // });

        this.bot.on('health', function() {
            if(bot.health < client.health)
                sendHTMLResponse("<i>You received " + (client.health - bot.health) + " damage. HP: " + bot.health + "/20</i>", chat_id);
            else if(bot.health == 20 && client.health != 20)
                sendHTMLResponse("<i>Your life is full again</i>", chat_id);
            client.health = bot.health;
        });

        this.bot.on('death', function() {
            sendHTMLResponse("<i>You died.</i>", chat_id);
        });

        this.bot.on('chat', (username, message) => {
            if(username === bot.username)
                return;
            sendTextResponse(username + ': ' + message, chat_id);
        });

        this.bot.on('message', (j) => {
            if(j.translate != 'chat.type.announcement' || j.translate.indexOf('commands.') == -1)
            {
                switch(j.translate)
                {
                    case 'chat.type.announcement':
                        sendTextResponse('Server: ' + j.with[1].extra.join(''), chat_id);
                        break;
                    case 'commands.generic.permission':
                        sendHTMLResponse("<i>You don't have permission to use this command.</i>", chat_id);
                        break;
                }
            }
            // sendTextResponse(username + ': ' + message, chat_id);
        });

        this.bot.on('whisper', (username, message) => {
            if(username === bot.username)
                return;
            sendHTMLResponse(username + ': ' + '<i>' + message.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('&', '&amp;') + '</i>', chat_id);
        });

        this.bot.on('nonSpokenChat', function(message) {
            sendTextResponse(message, chat_id);
        });

        this.bot.on('playerJoined', function(player) {
            if(player.username != bot.username) {
                sendHTMLResponse("<i>" + player.username + " joined the game</i>", chat_id);
            }
        });

        this.bot.on('playerLeft', function(player) {
            if(player.username != bot.username) {
                sendHTMLResponse("<i>" + player.username + " left the game</i>", chat_id);
            }
        });
    }
    this.say = (message) => {
        if(this.bot != null)
            this.bot.chat(message);
    }
    this.whisper = (username, message) => {
        if(this.bot != null)
            this.bot.whisper(username, message);
    }
}

var last_update = 0;

var clients = [];

function loop(){
    getUpdates((data) => {
        for(var i = 0; i<data.length; i++){
            var m = data[i];
            var chat_id = m.message.chat.id;

            if(m.update_id <= last_update)
                continue;

            var client = clients[m.message.from.id];
            if(client == null)
                client = clients[m.message.from.id] = new Client(m.message.from.id);
            client.chat_id = chat_id;

            var text = m.message.text;
            if(m.message.entities != null && m.message.entities.length > 0 && m.message.entities[0].type == 'bot_command'){
                switch(text.substr(m.message.entities[0].offset, m.message.entities[0].length)){
                    case '/join':
                        if(client.bot == null)
                        {
                            if(m.message.entities.length == 2){
                                try
                                {
                                    var arr = text.substr(m.message.entities[1].offset, m.message.entities[1].length).split(':');
                                    client.ip = arr[0];
                                    client.port = arr.length > 1 ? parseInt(arr[1]) : 25565;
                                    sendTextResponse('What is your username?', chat_id);
                                }
                                catch(err){
                                    sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                                }
                            }
                            else
                                sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                        }
                        else
                            sendTextResponse("You're already connected to a server. Use you must /quit before joining another", chat_id);
                        break;
                    case '/tell':
                        if(client.bot == null){
                            sendTextResponse('You must join a server before using this command.', chat_id);
                            break;
                        }
                        if(m.message.entities.length > 2)
                        {
                            try
                            {
                                var usr = text.substr(m.message.entities[1].offset, m.message.entities[1].length);
                                var msg = text.substring(m.message.entities[1].offset + m.message.entities[1].length, text.length);
                                this.bot.whisper(usr, msg);
                                
                            }
                            catch(err){
                                sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                            }
                        }
                        else
                            sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                        break;
                    case '/health':
                        if(client.bot == null){
                            sendTextResponse('You must join a server before using this command.', chat_id);
                            break;
                        }
                        else
                        {
                            sendTextResponse('Your health is ' + Math.round(client.bot.health / 20 * 100) + "% and your food is " + Math.round(client.bot.food / 20 * 100) + "%", chat_id);
                        }
                        break;
                    case '/quit':
                        if(client.bot == null){
                            sendTextResponse('You must join a server before using this command.', chat_id);
                            break;
                        }
                        else
                        {
                            sendHTMLResponse('<i>' + client.username + ' left the game</i>', chat_id);
                            client.bot.quit();
                            clients[client.id] = null;
                        }
                        break;
                    default:
                        if(client.bot == null){
                            sendTextResponse('Unknown command. Please type /help for a list of commands.', chat_id);
                            break;
                        }
                        else
                        {
                            client.say(text);
                        }
                        break;
                }
            }
            else if(client.ip != null && client.port != null)
            {
                if(client.username == null){
                    client.username = text;
                    // sendTextResponse('And what is your password?', chat_id);
                    client.connect();
                }
                // else if(client.password == null){
                //     client.password = text;
                //     sendTextResponse('Attemping to connect...', chat_id);
                //     client.connect();
                // }
                else
                {
                    if(client.bot != null){
                        client.say(text);
                    }
                }
            }
            last_update = m.update_id;
        }
    });
}

function getUpdates(callback)
{
    request(BASE_URL + "/getUpdates" + (last_update > 0 ? "?offset=" + (last_update + 1) : ""), function (err, response, body) {
        if(!err){
            var r = JSON.parse(body);
            if(r != null && r.ok)
                callback(r.result);
        }
    });
}

function sendTextResponse(text, chat_id){
    request.post(BASE_URL + "/sendMessage").form({
        text : text,
        chat_id : chat_id
    });
}

function sendHTMLResponse(text, chat_id){
    request.post(BASE_URL + "/sendMessage").form({
        text : text,
        chat_id : chat_id,
        parse_mode : 'HTML'
    });
}

setInterval(loop, 100);
console.log("Bot started successfully");