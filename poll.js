// Example usage.
// var Poll = require('./poll');
// var myPoll = Poll(['up', 'down', 'left', 'right']);
// myPoll.vote('up', 'voter-a');
// myPoll.vote('down', 'voter-b');
// myPoll.vote('up', 'voter-a');
// var results = myPoll.close();

const Result = require('r-result');
const Ok = Result.Ok;
const Fail = Result.Fail;

// [String] -> fns
const Poll = function (options) {
    const votes = options.reduce(function (votes, option) {
        votes[option.toLowerCase()] = 0;
        return votes;
    }, Object.create(null));

    const voters = [];

    var open = true;

    return {
        // (String, String) -> bool
        // Calling this function after the poll is closed is an error.
        vote: function (option, voter) {
            if (!open) {
                throw new Error("Cannot vote on closed poll.");
            }

            option = option.toLowerCase();

            if (typeof votes[option] !== "number") {
                return Fail("no-option");
            } else if (voters.indexOf(voter) !== -1) {
                return Fail("already-voted");
            } else {
                votes[option] += 1;
                voters.push(voter);
                return Ok();
            }
        },

        // Closes the poll, and transfers ownership of votes tally to caller.
        close: function () {
            open = false;
            return votes;
        }
    };
};

module.exports = Poll;