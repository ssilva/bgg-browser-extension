/*
 * Functions used by both popup.js and options.js go here.
 */

function loadOptions(callback) {
    chrome.storage.sync.get({
        boardGame: true,
        boardGameExpansion: true,
        boardGameAccessory: false,
        exactSearch: false
    }, function(items) {
        callback(items);
    });
}

function displayStatus(msg, timeout) {
    var status = document.getElementById("status");
    status.textContent = msg;

    if (timeout) {
        setTimeout(function() {
            status.textContent = "";
        }, timeout);
    }
}
