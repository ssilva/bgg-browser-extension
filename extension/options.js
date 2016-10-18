/*
 * Functions for options.html.
 * Dependencies: common.js
 */

function saveOptions() {
    var boardGame = document.getElementById("board-game").checked;
    var boardGameExpansion = document.getElementById("board-game-expansion").checked;
    var boardGameAccessory = document.getElementById("board-game-accessory").checked;
    var exactSearch = document.getElementById("exact-search").checked;

    if (!boardGame && !boardGameExpansion && !boardGameAccessory) {
        displayStatus("Error! Please select at least one of the following: board games, " +
            "board game expansions or board game accessories.");
        return;
    }

    chrome.storage.sync.set({
        boardGame: boardGame,
        boardGameExpansion: boardGameExpansion,
        boardGameAccessory: boardGameAccessory,
        exactSearch: exactSearch
    }, function() {
        displayStatus("Options saved.", 2400);
    });
}

function restoreOptions() {
    loadOptions(function(items) {
        document.getElementById("board-game").checked = items.boardGame;
        document.getElementById("board-game-expansion").checked = items.boardGameExpansion;
        document.getElementById("board-game-accessory").checked = items.boardGameAccessory;
        document.getElementById("exact-search").checked = items.exactSearch;
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
