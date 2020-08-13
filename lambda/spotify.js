const SpotifyWebApi = require('spotify-web-api-node');
let spotifyApi = new SpotifyWebApi();

module.exports = {
    playMusic : function(accessToken, deviceId) {
        return new Promise(function(resolve,reject) {
            spotifyApi.setAccessToken(accessToken);
            var options = {};
            if (deviceId) {
                options = {'device_id' : [deviceId]};
            }
            spotifyApi.play(options).then(function(data) {
                console.log('Done!', data);
                resolve(true);
            }, function(err) {
                console.log('Something went wrong!', err);
                resolve(false);
            });
        })
    },
    
    pauseMusic : function(accessToken) {
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.pause({})
          .then(function(data) {
            console.log('Done!', data);
          }, function(err) {
            console.log('Something went wrong!', err);
          });
    },
    
    getDevices : async function(accessToken) {
        return new Promise(function (resolve, reject) { 
            spotifyApi.setAccessToken(accessToken);
            spotifyApi.getMyDevices().then(
                (data) => {
                    // From the response, get the list of device objects
                    var device_objects = data['body']['devices'];
                    console.log(device_objects);
                    var device_map = new Map();
                    // We are only interested in the names of the device so add them to an array
                    for (let device_obj of device_objects) {
                        device_map.set(device_obj['name'], device_obj['id']);
                    }
                    console.log("about to return", device_map);
                    resolve(device_map);
                }, (err) => {
                    console.log('Something went wrong!', err);
                    reject(err);
                }
            );
        });
    },
    
    playMusicOnDevice : function(accessToken, deviceId) {
        spotifyApi.setAccessToken(accessToken);
        console.log("about to transer to: ", deviceId)
        spotifyApi.transferMyPlayback({"deviceIds" : [deviceId], "play" : true})
          .then(function(data) {
            console.log('Done!', data);
          }, function(err) {
            console.log('Something went wrong!', err);
          });
    },
    
    setDefaultDevice: function(accessToken, deviceId) {
        spotifyApi.setAccessToken(accessToken);
    }
    
};