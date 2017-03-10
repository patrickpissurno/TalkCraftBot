var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var shell = require('shelljs');
var fs = require('fs');
var mineflayer = require('mineflayer');
var app = express();

var API_TOKEN = "301876748:AAFc6ZoZH-I21gogXNzReaS8qEvEOXtmxS4";
var BASE_URL = "https://api.telegram.org/bot{{token}}".replace("{{token}}", API_TOKEN);

app.use(bodyParser.urlencoded({
  extended: true
}));

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

    this.bot = null;
    this.connect = () => {
        this.bot = mineflayer.createBot({
            host: this.ip,
            port: this.port,
            username: this.username,
            password: this.password,
            verbose: true,
        });

        this.bot.on('login', function() {
            sendTextResponse("Connection Success!", this.chat_id);
        });

        this.bot.on('chat', (username, message) => {
            if(username === bot.username)
                return;
            sendTextResponse(username + ': ' + message, this.chat_id);
        });

        this.bot.on('whisper', (username, message) => {
            if(username === bot.username)
                return;
            sendTextResponse(username + ': ' + '<i>' + message.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('&', '&amp;') + '</i>', this.chat_id);
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
            if(m.message.entities != null && m.message.entities.length > 0 && m.message.entities[0] == 'bot_command'){
                console.log(text.substr(m.message.entities[0].offset, m.message.entities[0].length));
                switch(text.substr(m.message.entities[0].offset, m.message.entities[0].length)){
                    case '/join':
                        console.log('> /join');
                        if(m.message.entities.length == 2){
                            try
                            {
                                var arr = text.substr(m.message.entities[1].offset, m.message.entities[1].length).split(':');
                                client.ip = arr[0];
                                client.port = arr.length > 1 ? parseInt(arr[1]) : 25565;
                                sendTextResponse('Please login with your Minecraft Account.\n\nWhat is your username?', chat_id);
                            }
                            catch(err){
                                sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                            }
                        }
                        else
                            sendTextResponse('Invalid arguments. Please type /help for a list of commands.', chat_id);
                        break;
                    case '/tell':
                        console.log('> /tell');
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
                }
            }
            else if(client.ip != null && client.port != null)
            {
                if(client.username == null){
                    client.username = text;
                    sendTextResponse('And what is your password?', chat_id);
                }
                else if(client.password == null){
                    client.password = text;
                    sendTextResponse('Attemping to connect...', chat_id);
                    client.connect();
                }
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

app.listen(80,function(){
    console.log("Working on port " + 80);
    setInterval(loop, 100);
});