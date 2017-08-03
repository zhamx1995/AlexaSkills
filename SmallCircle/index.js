var Alexa = require('alexa-sdk');
var FB = require('facebook-node');
var util = require('util');

// Messages used for Alexa to tell the user
var repeatWelcomeMessage = "you should be able to read feeds from you and your friends, and get new updates.";

var welcomeMessage = "Welcome to small circle";

var stopSkillMessage = "Ok, bye!";

var helpText = "You can say things like read my feed, or make a post, what would you like to do?";

var tryLaterText = "Please try again later.";

var noAccessToken = "Invalid access token, " + tryLaterText;

var noFriendPostAccessToken = "This friend does not grant access to posts.";

var accessToken = "";

var emptyFriendList = "Sorry, the friend list is empty." + tryLaterText;

var responseError = "Response error.";

var waitingText = "Waiting.";
var fetchingText = "Fetching data, " + waitingText;

// store friend information
var friendNames = [];
var friendIds = [];
var index_friend = 0;


// Create a new session handler
var Handler = {
    'NewSession': function () {

        // Access token is pass through from the session information
        accessToken = this.event.session.user.accessToken;
        
        // If we have an access token we can continue.
        if (accessToken) {
            FB.setAccessToken(accessToken);
            this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
        }
        else {
            // If we dont have an access token, we close down the skill. This should be handled better for a real skill.
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    'readMyFriendListIntent': function () {
        var alexa = this;

        // Again check if we have an access token
        if (accessToken) {
            // Call into FB module and get my feed
            FB.api("/me/friends", function (response) {
                if (response && !response.error) {
                    // If we have data
                    if (response.data) {
                        var output = response.data.length + " friends installed small circle. ";
                        // Read out names of some friends
                        var max = Math.min(response.data.length, 3);
                        output += "Some of them are: ";
                        for (var i=0;i<max;i++) {
                            friendIds.push(response.data[i].id);
                            friendNames.push(response.data[i].name);
                            if (i < max - 1 || response.data.length == 1) {
                                output += response.data[i].name + ", ";
                            } else {
                                output += "and " + response.data[i].name;
                            }
                        }
                        alexa.emit(':ask', output, output);
                    } else {
                        // REPORT PROBLEM WITH PARSING DATA
                        var output = "Error from Facebook";
                        alexa.emit(':ask', output, output);
                    }
                } else {
                    // Handle errors here.
                    console.log(response.error);
                }
            });
        } else {
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    // Read my fb friend list handler
    'readFriendRecentPostIntent': function () {
        var alexa = this;

        // Again check if we have an access token
        if (accessToken) {
            // Call into FB module and get my feed
            for (var i = 0; i < friendIds.length; i++) {
                FB.api("/" + friendIds[i] + "/posts", function (response) {
                    if (response && !response.error) {
                        // If we have data
                        if (response.data) {
                            var output = friendNames[index_friend] + " posted: " + response.data[0].message + ".";
                            if (index_friend == friendNames.length-1) {
                                index_friend = 0;
                            } else {
                                index_friend++;
                            }
                            alexa.emit(':ask', output, output);
                        } else {
                            // REPORT PROBLEM WITH PARSING DATA
                        }
                    } else {
                        // Handle errors here.
                        console.log(response.error);
                    }
                });
            }
        } else {
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    // Get my fb friend number handler
    'getMyFriendNumberIntent': function () {
        var alexa = this;

        // Again check if we have an access token
        if (accessToken) {
            // Call into FB module and get my feed
            FB.api("/me/friends", function (response) {
                if (response && !response.error) {
                    // If we have data
                    if (response.summary) {
                        var output = "You have " + response.summary.total_count + " " + "friends on Facebook";
                        alexa.emit(':ask', output, output);
                    } else {
                        // REPORT PROBLEM WITH PARSING DATA
                        var output = "Error from Facebook";
                        alexa.emit(':ask', output, output);
                    }
                } else {
                    // Handle errors here.
                    console.log(response.error);
                }
            });
        } else {
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },



    'AMAZON.CancelIntent': function () {
        // Triggered wheen user asks Alexa top cancel interaction
        this.emit(':tell', stopSkillMessage);
    },

    'AMAZON.StopIntent': function () {
        // Triggered wheen user asks Alexa top stop interaction
        this.emit(':tell', stopSkillMessage);
    },

    // Triggered wheen user asks Alexa for help
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpText, helpText);
    },

    // Triggered when no intent matches Alexa request
    'Unhandled': function () {
        this.emit(':ask', helpText, helpText);
    }
};

// Add handlers.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(Handler);
    alexa.execute();
};