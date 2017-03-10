# Minecraft Chat (TalkCraftBot)
Telegram Bot to chat in Minecraft servers

## Usage
Clone the repo and execute `npm install` to resolve the dependencies.
Then, execute `node index.js` and type your [Telegram API Token](https://core.telegram.org/bots#6-botfather).

## Available commands
- `/join <ip>:<port>` connect to a server (port defaults to 25565 if not specified)
- `/tell <username> <message>` sends a whisper (private message)
- `/health` shows your health and food
- `/quit` disconnect from the server

Most of Minecraft commands are implemented (e.g. `/tp`), but were not completely tested.

## Features
- Supports 1.8 servers (the version is hardcoded into the index.js, so you can easily change it up to 1.11 - but it was not tested)
- Supports only `online-mode=false` servers (no authentication at the moment)
- Receive messages from players
- Receive messages from server
- Receive whispers form players
- Send messages
- Send whispers
- Damage received notification
- Death notification
- Player join/left notification
- Basic Minecraft commands implementation (they will run, but silently. You only receive a message if you don't have permission to use that command)
- Does NOT work on pre-1.8 servers

## Dependencies
- [Node.js v6.0+](https://nodejs.org/)
- [Ubuntu](https://www.ubuntu.com/) or Windows (other operating systems should work but were not tested)
- [Telegram Account](https://telegram.org/)

## Special thanks
Special thanks to the [Mineflayer](https://github.com/PrismarineJS/mineflayer) Team for their Node.js Minecraft client.
