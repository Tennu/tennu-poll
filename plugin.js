const format = require('util').format;
const Poll = require('./poll');

const helps = {
    "open": [
        "{{!}}poll-open option-a option-b ... option-z",
        "",
        "Starts a poll in the channel.",
        "Aliases: {{!}}poll {{!}}pollopen {{!}}open-poll {{!}}openpoll {{!}}poll-start {{!}}pollstart {{!}}start-poll {{!}}startpoll"
    ],

    "close": [
        "{{!}}poll-close",
        "",
        "Closes the poll in the channel, displaying the results of the poll.",
        "Aliases: {{!}}pollclose {{!}}close-poll {{!}}closepoll {{!}}poll-end {{!}}pollend {{!}}end-poll {{!}}endpoll"
    ],

    "vote": [
        "{{!}}vote option",
        "",
        "Vote for an option in the current channel poll.",
        "Aliases: {{!}}poll-vote"
    ]
};

module.exports = {
    init: function (client, imports) {
        // Dict<ChannelName, Poll>
        const openPolls = Object.create(null);
        const requiresPermission = imports.admin.requiresPermission || imports.admin.requiresAdmin;


        const requiresPoller = function (handler) {
            return requiresPermission(handler, "poller");
        };

        return {
            handlers: {
                "!poll !poll-open !pollopen !open-poll !openpoll !poll-start !pollstart !start-poll !startpoll": requiresPoller(function (command) {
                    if (command.isQuery) {
                        return "Sorry, polls can only be started in channels.";
                    }

                    if (openPolls[command.channel]) {
                        return "Cannot start a new poll while another poll is already active.";
                    }

                    if (command.args.length < 2) {
                        return "A poll must have at least two options.";
                    }

                    openPolls[command.channel] = Poll(command.args);
                    return "Poll started.";
                }),

                "!poll-close !pollclose !close-poll !closepoll !poll-end !pollend !end-poll !endpoll": requiresPoller(function (command) {
                    if (!openPolls[command.channel]) {
                        return "There is no open poll in here to close.";
                    }

                    const results = openPolls[command.channel].close();
                    delete openPolls[command.channel];

                    return [
                        "Poll is now closed! Results:",

                        Object.keys(results)
                        .map(function (key) { return [key, results[key]]; })
                        .sort(function (lhs, rhs) { return lhs[1] <= rhs[1]; })
                        .map(function (result) { return format("%s: %s", result[0], result[1]); })
                        .join(" | ")
                    ];
                }),

                "!poll-vote !vote": function (command) {
                    if (!openPolls[command.channel]) {
                        return "There is no open poll to vote for.";
                    }

                    if (command.args.length === 0) {
                        return "You must specify an option.";
                    }

                    return openPolls[command.channel]
                    .vote(command.args[0], command.nickname)
                    .map(function () {
                        return format("%s voted for %s.", command.nickname, command.args[0]);
                    })
                    .unwrapOrElse(function (failureReason) {
                        switch (failureReason) {
                            case "no-option":     return format("%s: %s is not an option!", command.nickname, command.args[0]);
                            case "already-voted": return format("%s: You've already voted for this poll.", command.nickname);
                            default:
                                client.error("PluginPoll", format("Unhandled failure reason in !poll-vote: %s", failureReason));
                                return format("Error: Unhandled failure reason in text replacement ('%s').", failureReason);
                        }
                    });
                },

                "privmsg": function (message) {
                    if (!openPolls[message.channel]) { return; }
                    const words = message.message.split(" ");
                    if (words.length !== 1) { return; }
                    const option = words[0];
                    const result = openPolls[message.channel].vote(option, message.nickname);
                    if (result.isOk()) {
                        return format("%s voted for %s.", message.nickname, option);
                    }
                }
            },

            "commands": ["poll-open", "poll-close", "vote"],

            "help": {
                "poll": helps.open,
                "poll-open": helps.open,
                "pollopen": helps.open,
                "open-poll": helps.open,
                "openpoll": helps.open,
                "poll-start": helps.open,
                "pollstart": helps.open,
                "start-poll": helps.open,
                "startpoll": helps.open,
                "poll-close": helps.close,
                "pollclose": helps.close,
                "close-poll": helps.close,
                "closepoll": helps.close,
                "poll-end": helps.close,
                "pollend": helps.close,
                "end-poll": helps.close,
                "endpoll": helps.close,
                "poll-vote": helps.vote,
                "vote": helps.vote
            }
        };
    },

    requiresRoles: ["admin"]
};