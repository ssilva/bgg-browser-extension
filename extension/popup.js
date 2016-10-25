/*
 * Functions for popup.html.
 * Dependencies: common.js
 */

const API_BASE_URL = "https://boardgamegeek.com/xmlapi2";

var OPTIONS = {};
loadOptions(function(opts) {
    OPTIONS = opts;
    console.log("OPTIONS=" + JSON.stringify(OPTIONS));
});

document.addEventListener("DOMContentLoaded", function() {
    chrome.tabs.executeScript({ code: "window.getSelection().toString();" }, handleSelection);
    document.getElementById("search").addEventListener("keyup", handleSearchKeyUp);
});

function handleSelection(selection) {
    // This error will be thrown if the user activates the extension while not on a web page.
    if (chrome.runtime.lastError) {
        displayStatus("or go to a webpage");
        displaySearch();
        return;
    }

    var selectedText = selection[0].trim();
    if (selectedText.length > 1 && selectedText.length < 100) {
        displaySpinner();
        searchForItem(selectedText);
    } else {
        displayStatus("or select the name of a game");
        displaySearch();
    }
}

function handleSearchKeyUp(event) {
    event.preventDefault();

    if (event.code === "Enter") {
        var query = document.getElementById("search").value;
        query = query.trim();
        if (query.length > 1) {
            displaySpinner();
            searchForItem(query.trim());
        } else {
            displayStatus("or enter the name of a game");
        }
    }
}

function searchForItem(name) {
    var url = buildSearchUrl(name);
    httpGet(url, function() {
        if (this.readyState !== XMLHttpRequest.DONE)
            return;

        var items = this.responseXML.getElementsByTagName("items")[0];
        if (items.attributes.total.value > 0) {
            var ids = pickBestMatch(items);
            for (let id of ids)
                retrieveItem(id);
        } else {
            console.info("searchForItem(): '%s' not found.", name);
            hideSpinner();
            displayStatus("\"" + name + "\" was not found.");
            displaySearch(name);
        }
    });
}

function pickBestMatch(items) {
    if (items.children.length < 2)
        return [items.children[0].id];

    // If there is more than one item, pick the best match. Assume that older items are more
    // known, and thus have a higher chance of being what the user is looking for.
    var ids = [];
    for (let child of items.children)
        ids.push(child.id);

    ids.sort();
    return ids.slice(0, OPTIONS.numOfItemsToDisplay);
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
        for (let r of ranks) {
            if (r.attributes.name.nodeValue === "boardgame") {
                rank = r.attributes.value.nodeValue;
                break;
            }
        }

        console.info("retrieveItem(): %s (%s): %s - %s", name, yearPublished, rating, rank);
        hideSpinner();
        displayStatus("");
        hideSearch();
        displayItem(0, id, name, rating, yearPublished, type, rank);
    });
}

function displayItem(index, id, name, rating, yearPublished, type, rank) {
    var itemDiv = document.createElement("div");
    itemDiv.id = "item-" + index;
    itemDiv.classList.add("item");

    itemDiv.appendChild(createNameDiv(index, id, name, yearPublished, type));
    itemDiv.appendChild(createRatingDiv(index, rating));
    itemDiv.appendChild(createRankDiv(index, rank));

    document.getElementById("items").appendChild(itemDiv);

    // This is to allow the hyperlink to work
    window.addEventListener('click', function(e) {
        if(e.target.href !== undefined) {
            chrome.tabs.create({ url: e.target.href });
        }
    });
}

function createNameDiv(index, id, name, yearPublished, type) {
    var nameDiv = document.createElement("div");
    nameDiv.id = "name-" + index;
    nameDiv.classList.add("name");

    var aTag = document.createElement("a");
    var url = "https://boardgamegeek.com/" + type + "/" + id;
    aTag.setAttribute("href", url);
    aTag.setAttribute("title", url);
    aTag.innerHTML = name;
    nameDiv.appendChild(aTag);
    var yearPublishedTxt = document.createTextNode(" (" + yearPublished + ")");
    nameDiv.appendChild(yearPublishedTxt);
    return nameDiv;
}

function createRatingDiv(index, rating) {
    var ratingDiv = document.createElement("div");
    ratingDiv.id = "rating-" + index;

    var ratingNum = new Number(rating);
    ratingDiv.textContent = ratingNum.toFixed(1);
    ratingDiv.classList.add("rating", "rating-" + ratingNum.toFixed(0));
    ratingDiv.style.display = "block";
    return ratingDiv;
}

function createRankDiv(index, rank) {
    var rankDiv = document.createElement("div");
    rankDiv.id = "rank-" + index;
    rankDiv.classList.add("rank");
    rankDiv.textContent = "Ranking: " + rank;
    rankDiv.style.display = "block";
    return rankDiv;
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

function displaySearch(query) {
    var searchInput = document.getElementById("search");
    searchInput.style.display = "block";
    searchInput.focus = true;

    if (query)
        searchInput.value = query;
}

function hideSearch() {
    document.getElementById("search").style.display = "none";
}

function httpGet(url, onReady) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReady;
    console.info("httpGet(): " + url);
    xhr.open("GET", url, true);
    xhr.send();
}
