require.paths.unshift("./node_modules");
var brain = require("brain"),
    irc = require("irc"),
    options = require("nomnom").opts({
        host: {
            string: "-H HOST, --host=HOST",
            default: "localhost",
            help: "What IRC network to connect to. (Default: localhost)"
        },
        nick: {
            string: "-n NICK, --nick=NICK",
            default: "mscott",
            help: "IRC nick to use. (Default: mscott)"
        },
        channels: {
            string: "-c CHANNELS, --channels=CHANNELS",
            default: "",
            help: "IRC channels to join (comma-separated, no '#')."
        },
        redisHost: {
            string: "--redis-host=HOST",
            default: "localhost",
            help: "Redis host to use. (Default: localhost)"
        },
        redisPort: {
            string: "--redis-port=PORT",
            default: 6379,
            help: "Redis port to use. (Default: 6379)"
        }
    }).parseArgs();
    lastLine = {};

var bayes = new brain.BayesianClassifier({
    backend: {
        type: "redis",
        options: {
            hostname: options.redisHost,
            port: options.redisPort,
            name: "scottbot"
        }
    },
    thresholds: {
        funny: 3,
        notfunny: 1
    },
    def: "notfunny"
});

var CHANNELS = options.channels.split(',');
CHANNELS.forEach(function(channel, i) {
    CHANNELS[i] = '#' + channel.trim();
});

var client = new irc.Client(options.host, options.nick, {
    channels: CHANNELS
});

client.addListener("error", function(msg) {
    console.log(msg);
});

client.addListener("message", function(from, to, message) {
    var target, isChannel = false,
        nick = new RegExp('^' + options.nick + '[:,]\s*', 'i');
    if (to.indexOf("#") == 0) {
        target = to;
        isChannel = true;
    } else {
        target = from;
    }

    if (isChannel) {
        if (message.match(nick) {
            message = message.replace(nick, '').replace(/\s*$/, '');
            if (message.match(/^no$/i)) {
                if (lastLine[target]) {
                    bayes.train(lastLine[target], "notfunny", function() {
                        client.say(target, "sorry :(");
                    });
                }
            } else if (message.match(/^yes$/i)) {
                if (lastLine[target]) {
                    bayes.train(lastLine[target], "funny", function() {
                        client.say(target, "ok!");
                    });
                }
            } else if (message.match(/^lol$/i)) {
                if (lastLine[target]) {
                    bayes.train(lastLine[target], "funny", function() {});
                }
            } else if (message.match(/botsnack/i)) {
                client.say(target, "nom nom nom");
            } else if (message.match(/".*" is funny/i)) {
                phrase = message.match(/".*"/i)[0].slice(1, -1);
                bayes.train(phrase, "funny", function() {
                    client.say(target, "ok!");
                });
            }
        } else {
            lastLine[target] = message;
            bayes.classify(message, function(category) {
                if (category == "funny") {
                    client.say(target, "that's what she said");
                }
            });
        }
    }
});

client.addListener("invite", function(channel, from) {
    client.join(channel, function() {
        client.say(from, "Joined " + channel);
    });
});
