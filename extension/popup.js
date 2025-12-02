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

document.addEventListener("DOMContentLoaded", handleContentLoaded);

async function handleContentLoaded() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
        displayStatus("or go to a webpage");
        displaySearch();
        return;
    }

    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getSelectionString
    });

    handleSelection(results);

    document.getElementById("search").addEventListener("keyup", handleSearchKeyUp);
}

function getSelectionString() {
  return window.getSelection().toString();
}

function handleSelection(selection) {
    if (!selection || selection.length === 0 || selection[0] === undefined) {
        displayStatus("selection undefined");
        displaySearch();
        return;
    }

    var selectedText = selection[0].result.trim();
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

    if (event.key === "Enter") {
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

async function searchForItem(name) {
    var url = buildSearchUrl(name);
    try {
        const responseXML = await httpGet(url);
        var items = responseXML.getElementsByTagName("items")[0];
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
    } catch (error) {
        console.error("Error during search:", error);
        hideSpinner();
        displayStatus("Error during search: " + error);
    }
}

function compareNumbers(a, b) {
    return a - b;
}

function pickBestMatch(items) {
    if (items.children.length < 2)
        return [items.children[0].id];

    // If there is more than one item, pick the best match. Assume that older items are more
    // known, and thus have a higher chance of being what the user is looking for.
    var ids = [];
    for (let child of items.children)
        ids.push(child.id);

    ids.sort(compareNumbers);
    return ids.slice(0, OPTIONS.numOfItemsToDisplay);
}

async function retrieveItem(id) {
    var url = API_BASE_URL + "/thing?stats=1&id=" + id;
    try {
        const responseXML = await httpGet(url);

        var name = responseXML.getElementsByTagName("name")[0].attributes.value.nodeValue;
        var rating = responseXML.getElementsByTagName("average")[0].attributes.value.nodeValue;
        var ranks = responseXML.getElementsByTagName("rank");
        var yearPublished = responseXML.getElementsByTagName("yearpublished")[0].attributes.value.nodeValue;
        var type = responseXML.getElementsByTagName("item")[0].attributes.type.nodeValue;

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
    } catch (error) {
        console.error("Error during retrieval:", error);
        hideSpinner();
        displayStatus("Error fetching item details.");
    }
}

function displayItem(index, id, name, rating, yearPublished, type, rank) {
    var itemDiv = document.createElement("div");
    itemDiv.id = "item-" + index;
    itemDiv.classList.add("item");

    itemDiv.appendChild(createNameDiv(index, id, name, yearPublished, type));
    itemDiv.appendChild(createRatingDiv(index, rating));
    itemDiv.appendChild(createRankDiv(index, rank));

    document.getElementById("items").appendChild(itemDiv);
}

function createNameDiv(index, id, name, yearPublished, type) {
    var nameDiv = document.createElement("div");
    nameDiv.id = "name-" + index;
    nameDiv.classList.add("name");

    var aTag = document.createElement("a");
    var url = "https://boardgamegeek.com/" + type + "/" + id;
    aTag.setAttribute("href", url);
    aTag.setAttribute("title", url);
    aTag.setAttribute("target", "_blank");
    aTag.appendChild(document.createTextNode(name));

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

    params.push("query=" + encodeURIComponent(name));

    return API_BASE_URL + "/search?" + params.join("&");
}

function displaySearch(query) {
    var searchInput = document.getElementById("search");
    searchInput.style.display = "block";

    if (query)
        searchInput.value = query;

    setTimeout(() => {
        document.getElementById("search").focus();
    }, 100);
}

function hideSearch() {
    document.getElementById("search").style.display = "none";
}

async function httpGet(url) {
    console.info("httpGet(): " + url);
    const response = await fetch(url, {headers: {"Authorization": "Bearer 9716e4a7-f402-4833-9877-ea877c79fbcS"}});
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return new DOMParser().parseFromString(text, "text/xml");
}
