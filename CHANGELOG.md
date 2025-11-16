Changelog
=========

v1.6.1 (2025-11-12)
-------------------
* Add Firefox-required properties to manifest.

v1.6.0 (2025-11-03)
-------------------
* Update to manifest version 3.
* Change name from "Quick BGG Rating" to "Quick Board Game Rating" to comply with BoardGameGeek.com terms. 

v1.5.3 (2020-11-07)
-------------------
* Fix a bug whereby games containing special characters (e.g. ampersands) did not return any results. This affected Firefox only.

v1.5.2 (2020-10-31)
-------------------
* Fix a bug in the logic that picks the best matches among the items returned by the API.

v1.5.1 (2020-10-21)
-------------------
* Enable exact search by default
* Fixes a bug where two identical tabs were opened when an item's name was clicked on. This affected Firefox only.

v1.5.0 (2019-06-06)
-------------------
* Make it compatible with Firefox.

v1.4.4 (2019-06-01)
-------------------
* Add <kbd>Alt-Shift-S</kbd> as the default keyboard shortcut to activate the
extension.

v1.4.3 (2019-05-16)
-------------------
* When the extension is activated, set the focus on the search box.

v1.4.2 (2017-05-21)
-------------------
* Fix a bug that kept the search box from being displayed the first time the extension is opened on a page.

v1.4.1 (2016-10-30)
-------------------
* Do not open more than one tab when the user clicks on a link.

v1.4.0 (2016-10-25)
-------------------
* Show search box when: no text is selected, the user is not on a webpage or the game was not found.
* Add ability to show more than one item.

v1.3.0 (2016-10-20)
-------------------
* Add options page.
* Display global ranking (thanks to [@ablanco](https://github.com/ablanco)).

v1.2 (2016-10-17)
-----------------
* Make the search less restrictive/specific.
* Trim the selected text.

v1.1 (2016-10-13)
-----------------
Small bug fixes:

* Hide the spinner if the game is not found.
* Handle the case where the extension is used on the 'New Tab' page.

v1.0 (2016-10-12)
-----------------
First release