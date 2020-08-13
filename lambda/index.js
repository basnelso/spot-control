// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const spotifyApi = require('./spotify')

// Dev console handles access token retrieval/refresh
let accessToken = undefined


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            var output = "Welcome to Spotify Device Controller! Ask Alexa to tell spot control to play music and I can do so on your current device."
            return handlerInput.responseBuilder
                .speak(output)
                .getResponse();
        }
    }
};

// Get all devices and tell the user their identification numbers
const GetDevicesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetDevicesIntent';
    },
    
    async handle(handlerInput) {
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            // Get a map of device names mapped to device ids.
            var device_map = await spotifyApi.getDevices(accessToken);
            console.log("got from function", device_map);
            var devicesStr = "";
            var num = 1;
            device_map.forEach((id, device) => {
                devicesStr += `${num}, ${device}, `;
                num += 1;
            });
            console.log(devicesStr);
            var speakOutput = "Your devices are: " + devicesStr;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }

    }
};

// Play music on the user's current device.
const PlayMusicIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicIntent';
    },
    
    async handle(handlerInput) {
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            var success = await spotifyApi.playMusic(accessToken);
            console.log("got success res, ", success);
            if (!success) {
                console.log("couldn't play music, trying with default device");
                var defaultDevice = '0894e6879b260142339a9a7900b52f0a8e2c1c56'; // Get default device from mongo DB
                await spotifyApi.playMusic(accessToken, defaultDevice);
            }
            return handlerInput.responseBuilder
                .speak("Music Played")
                .getResponse();
        }

    }
};

// Play music on the user's specified device. User specifies a device using its number.
const PlayMusicOnDeviceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicOnDeviceIntent';
    },
    
    async handle(handlerInput) {
        console.log("entered handler")
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            var device_number = handlerInput.requestEnvelope.request.intent.slots.device_number.value;
            console.log("user said: ", device_number);
            var device_map = await spotifyApi.getDevices(accessToken);
            var device_arr = [];
            device_map.forEach((id, device) => {
                device_arr.push(id);
            });
            spotifyApi.playMusicOnDevice(accessToken, device_arr[device_number-1]);
            return handlerInput.responseBuilder
                .speak(`Music Played on ${device_number}`)
                .getResponse();
        }

    }
};

// Set a user's default device for when their session is inactive and they want to play music.
const SetDefualtDeviceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicOnDeviceIntent';
    },
    
    handle(handlerInput) {
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            var device = handlerInput.requestEnvelope.request.intent.slots.deviceId.value; // Need to get it from intent
            // Update S3 bucket with user's default device
            return handlerInput.responseBuilder
                .speak(`${device} is now the default device.`)
                .getResponse();
        }

    }
};

// Pause currently playing music.
const PauseMusicIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PauseMusicIntent';
    },
    
    handle(handlerInput) {
        accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        if (!accessToken) {
            return AuthFlow(handlerInput);
        } else {
            spotifyApi.pauseMusic(accessToken);
            return handlerInput.responseBuilder
                .speak("Music paused.")
                .getResponse();
        }

    }
};

// Function that is called when user has not given Spotify Device Controller access to their spotify account.
function AuthFlow(handlerInput) {
    var speakOutput = "Hi! Before using this skill you need to link your spotify account. Please go to your Alexa App and follow the instructions."
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withLinkAccountCard()
            .getResponse();
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GetDevicesIntentHandler,
        PlayMusicOnDeviceIntentHandler,
        PlayMusicIntentHandler,
        PauseMusicIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
