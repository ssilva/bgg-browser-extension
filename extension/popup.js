/*
 * Functions for popup.html.
 * Dependencies: common.js
 */

const API_BASE_URL = "https://boardgamegeek.com/xmlapi2";

var OPTIONS = {};
loadOptions(function(opts) { OPTIONS = opts; });
console.log("OPTIONS=" + OPTIONS);

document.addEventListener("DOMContentLoaded", function() {
    chrome.tabs.executeScript({ code: "window.getSelection().toString();" }, handleSelection);
});

function handleSelection(selection) {
    // This error will be thrown if the user activates the extension while not on a web page.
    if (chrome.runtime.lastError) {
        displayStatus("Go to a webpage!");
        return;
    }

    var selectedText = selection[0].trim();
    if (selectedText.length > 0 && selectedText.length < 100) {
        displaySpinner();
        searchForItem(selectedText);
    } else {
        displayStatus("Select the name of a game!");
    }
}

function searchForItem(name) {
    var url = buildSearchUrl(name);
    httpGet(url, function() {
        if (this.readyState !== XMLHttpRequest.DONE)
            return;

        var items = this.responseXML.getElementsByTagName("items")[0];
        if (items.attributes.total.value > 0) {
            var id = pickBestMatch(items);
            retrieveItem(id);
        } else {
            console.info("searchForItem(): '%s' not found.", name);
            hideSpinner();
            displayStatus("Game \"" + name + "\" was not found.");
        }
    });
}

function pickBestMatch(items) {
    if (items.children.length < 2)
        return items.children[0].id;
    
    // If there are more than one item we need to decide which one is the best match.
    // We are assuming that items that have been around for longer are more popular,
    // thus have a higher chance of being what the user is looking for.
    var lowestId = items.children[0].id;
    for (var i = 1; i < items.children.length; i++) {
        if (items.children[i].id < lowestId)
            lowestId = items.children[i].id;
    }
    return lowestId;
}

function retrieveItem(id) {
    var url = API_BASE_URL + "/thing?stats=1&id=" + id;
    httpGet(url, function() {
        if (this.readyState !== XMLHttpRequest.DONE)
            return;

        var name = this.responseXML.getElementsByTagName("name")[0].attributes.value.nodeValue;
        var rating = this.responseXML.getElementsByTagName("average")[0].attributes.value.nodeValue;
        var ranks = this.responseXML.getElementsByTagName("rank");
        var yearPublished = this.responseXML.getElementsByTagName("yearpublished")[0].attributes.value.nodeValue;
        var type = this.responseXML.getElementsByTagName("item")[0].attributes.type.nodeValue;

        var rank = "Not found";
        for (var i = 0; i < ranks.length; i += 1) {
            if (ranks[i].attributes.name.nodeValue === "boardgame") {
                rank = ranks[i].attributes.value.nodeValue;
            }
        }

        console.info("retrieveItem(): %s (%s): %s - %s", name, yearPublished, rating, rank);
        hideSpinner();
        displayItem(id, name, rating, yearPublished, type, rank);
    });
}

function displayItem(id, name, rating, yearPublished, type, rank) {
    var nameDiv = document.getElementById("name");
    nameDiv.textContent = "";

    var aTag = document.createElement("a");
    var url = "https://boardgamegeek.com/" + type + "/" + id;
    aTag.setAttribute("href", url);
    aTag.setAttribute("title", url);
    aTag.innerHTML = name;
    nameDiv.appendChild(aTag);
    var yearPublishedTxt = document.createTextNode(" (" + yearPublished + ")");
    nameDiv.appendChild(yearPublishedTxt);

    var ratingDiv = document.getElementById("rating");
    var ratingNum = new Number(rating);
    ratingDiv.textContent = ratingNum.toFixed(1);
    ratingDiv.classList.add("rating-" + ratingNum.toFixed(0));
    ratingDiv.style.display = "block";

    var rankDiv = document.getElementById("rank");
    rankDiv.textContent = "Ranking: " + rank;
    rankDiv.style.display = "block";

    // This is to allow the hyperlink to work
    window.addEventListener('click', function(e) {
        if(e.target.href !== undefined) {
            chrome.tabs.create({ url: e.target.href });
        }
    });
}

function displaySpinner() {
    document.getElementById("spinner").style.display = "block";
}

function hideSpinner() {
    document.getElementById("spinner").style.display = "none";
}

function buildSearchUrl(name) {
    var params = [];

    var typeValues = [];
    if (OPTIONS.boardGame)
        typeValues.push("boardgame");
    if (OPTIONS.boardGameAccessory)
        typeValues.push("boardgameaccessory");
    if (OPTIONS.boardGameExpansion)
        typeValues.push("boardgameexpansion");
    if (typeValues.length > 0)
        params.push("type=" + typeValues.join(","));

    if (OPTIONS.exactSearch)
        params.push("exact=1");

    params.push("query=" + name);

    return API_BASE_URL + "/search?" + params.join("&");
}

function httpGet(url, onReady) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReady;
    console.info("httpGet(): " + url);
    xhr.open("GET", url, true);
    xhr.send();
}
