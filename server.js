var net = require('net');
var fs = require('fs');
var async = require('async');

var host = '192.168.168.118';
var port = 1987;

var clients = [];

net.createServer(function (sock) {
    console.log('Connected: ' + sock.remoteAddress + ': ' + sock.remotePort);

    var _nickName = '';

    sock.on('data', function (data) {
        console.log('Received: ' + data);

        var msg = parseMessage(data);

        console.log('msgType = ' + msg.msgType);

        switch (msg.msgType) {
            case 'signin':
                var client = { nick: msg.sender, socket: sock };

                if (validateUser(msg.sender, msg.content)) {
                    clients.push(client);

                    sock.write('sender:server;receiver:;msgType:rResponse;content:1');

                    console.log('signin occured. Clients count = ', clients.length);
                    console.log(msg.sender + ' is online');
                }
                else {
                    sock.write('sender:server;receiver:;msgType:lResponse;content:0');
                }
                break;
            case 'register':
                if (registerUser(msg)) {
                    sock.write('sender:server;receiver:;msgType:rResponse;content:1');
                }
                else {
                    sock.write('\sender:server;receiver:;msgType:rResponse;content:0');
                }
                break;
            case 'message':
                break;
            default:
                console.log('unknown message');
                break;
        }
    });

    sock.on('error', function (exception) {
        removeClientByNick(_nickName);

        console.log('SOCKET ERROR ' + exception.toString());
        sock.destroy();
    })

    sock.on('close', function (data) {
        console.log('Closed: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('end', function () {
        console.log('Client left ' + sock.remoteAddress);
    });
}).listen(port, host);

console.log('Server listening on ' + host + ':' + port);

function parseMessage(data) {
    var result = {};
    var splitted = data.toString().split(';')

    if (splitted.length != 4)
        return { msgType: 'unknown', content: '', sender: '', receiver: '' };

    var node = splitted[0].split(':');
    if (node.length != 2)
        return { msgType: 'unknown', content: '', sender: '', receiver: '' };

    result.sender = node[1];

    node = splitted[1].split(':');
    if (node.length != 2)
        return { msgType: 'unknown', content: '', sender: '', receiver: '' };

    result.receiver = node[1];

    node = splitted[2].split(':');
    if (node.length != 2)
        return { msgType: 'unknown', content: '', sender: '', receiver: '' };

    result.msgType = node[1];

    node = splitted[3].split(':');
    if (node.length != 2)
        return { content: 'unknown', content: '', sender: '', receiver: '' };

    result.content = node[1];

    return result;
};

function removeClientByNick(nick) {
    var index = null;
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].nick == nick) {
            index = i;
            break;
        }
    }

    if (index != null)
        clients.splice(index, 1);
};

function getClientByNick(nick) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].nick == nick)
            return clients[i];
    }

    return null;
};

function registerUser(msg) {
    console.log('sender is ' + msg.sender);

    var uniqueResult = isUserUnique(msg.sender);

    console.log('un result: ' + uniqueResult);

    if (!uniqueResult) {
        return false;
    }

    var dataToWrite = msg.sender + ':' + msg.content + '\r\n';
    console.log('data to file:' + dataToWrite);

    fs.appendFile('users.txt', dataToWrite, function (err) {
        if (err) return console.log(err);
    });

    return true;
};

function isUserUnique(nick) {
    var result = true;

    var data = fs.readFileSync('users.txt', 'utf8');

    var lines = data.toString().split('\r\n');

    for (var i = 0; i < lines.length; i++) {
        var nickFromFile = lines[i].replace('\r\n', '').split(':')[0];

        console.log('nickFromFile: ' + nickFromFile);
        console.log(nick == nickFromFile);

        if (nick == nickFromFile) {
            result = false;
        }
    }

    return result;
};

function validateUser(nick, pubKey) {
    var data = fs.readFileSync('users.txt', 'utf8');
    var lines = data.split('\r\n');
    for (var i = 0; i < lines.length; i++) {
        var nickFromFile = lines[i].replace('\r\n', '').split(':')[0];
        var pKeyFromFile = lines[i].replace('\r\n', '').split(':')[1];

        if (nick == nickFromFile) {
            console.log('pKeyFromFile: ' + pKeyFromFile);
            console.log('pubKey: ' + pubKey);
            var compRes = pubKey == pKeyFromFile;
            console.log('are equal: ' + compRes);
            result = true;
        }
    }

    return false;
};