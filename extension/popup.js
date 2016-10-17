const BASE_URL = "https://boardgamegeek.com/xmlapi2";

document.addEventListener("DOMContentLoaded", function() {
    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function(selection) {
        if (chrome.runtime.lastError) {
            // This error will be thrown if the user clicks on the extension
            // button while on the 'New Tab' page.
            displayError("Go to a webpage!");
            return;
        }
        if (selection[0].length > 0 && selection[0].length < 100) {
            displaySpinner();
            searchByName(selection[0]);
        } else {
            displayError("Select the name of a game!");
        }
    });
});

function searchByName(name) {
    var url = BASE_URL + "/search?type=boardgame,boardgameaccessory,boardgameexpansion&exact=1" +
        "&query=" + name;
    httpGet(url, function() {
        if (this.readyState == 4) {
            var items = this.responseXML.getElementsByTagName("items")[0];
            if (items.attributes.total.value > 0) {
                getRating(items.children[0].id);
            } else {
                console.info("searchByName(): '%s' not found.", name);
                hideSpinner();
                displayError("Game \"" + name + "\" was not found.");
            }
        }
    });
}

function getRating(id) {
    var url = BASE_URL + "/thing?stats=1&id=" + id;
    httpGet(url, function() {
        if (this.readyState == 4) {
            var name = this.responseXML.getElementsByTagName("name")[0].attributes.value.nodeValue;
            var rating = this.responseXML.getElementsByTagName("average")[0].attributes.value.nodeValue;
            var ranks = this.responseXML.getElementsByTagName("rank");
            var yearPublished = this.responseXML.getElementsByTagName("yearpublished")[0].attributes.value.nodeValue;
            var type = this.responseXML.getElementsByTagName("item")[0].attributes.type.nodeValue;

            var rank = 'Not found';
            for (var i = 0; i < ranks.length; i += 1) {
                if (ranks[i].attributes.name.nodeValue === "boardgame") {
                    rank = ranks[i].attributes.value.nodeValue;
                }
            }

            console.info("getRating(): %s (%s): %s - %s", name, yearPublished, rating, rank);
            hideSpinner();
            displayResults(id, name, rating, yearPublished, type, rank);
        }
    });
}

function displayResults(id, name, rating, yearPublished, type, rank) {
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

function displayError(msg) {
    document.getElementById("name").textContent = msg;
}

function httpGet(url, onReady) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReady;
    console.info("httpGet(): " + url);
    xhr.open("GET", url, true);
    xhr.send();
}
