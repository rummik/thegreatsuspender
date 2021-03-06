/*global window, document, chrome, console, Image, gsStorage */

(function() {

    'use strict';

    var unsuspending = false;

    function sendSuspendedMessage() {
        if (typeof(chrome.runtime.getManifest()) !== 'undefined') {
            chrome.runtime.sendMessage({action: 'setSuspendedState'});
        }
    }
    function sendUnsuspendedMessage() {
        if (typeof(chrome.runtime.getManifest()) !== 'undefined') {
            chrome.runtime.sendMessage({action: 'setUnsuspendedState'});
        }
    }

    function unsuspendTab() {

        if (!unsuspending) {

            unsuspending = true;
            sendUnsuspendedMessage();

            document.body.style.cursor = 'wait';

            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.reload();
            }
            //window.location.reload();
        }
    }

    function generateFaviconUri(url, callback) {

        var img = new Image(),
            boxSize = 9;
        img.onload = function() {
            var canvas,
                context;
            canvas = window.document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            context = canvas.getContext('2d');
            //context.globalAlpha = 0.5;
            context.drawImage(img, 0, 0);
            //context.globalAlpha = 1;
            //context.strokeRect(0, 0, img.width, img.height);
            //context.fillStyle = 'rgb(233, 176, 127)';
            //context.fillStyle = 'rgb(243, 186, 115)';
            context.fillStyle = 'rgb(255, 255, 255)';
            context.fillRect(img.width - boxSize, img.height - boxSize, boxSize, boxSize);

            context.fillStyle = 'rgb(0, 0, 0)';
            context.globalAlpha = 1;

            context.fillRect(img.width - boxSize, img.height - boxSize, boxSize, 1);
            context.fillRect(img.width - boxSize, img.height - boxSize, 1, boxSize);
            context.fillRect(img.width - 1, img.height - boxSize, 1, boxSize);
            context.fillRect(img.width - boxSize, img.height - 1, boxSize, 1);

            context.fillRect(img.width - 7, img.height - (boxSize + 1), 3, 1);
            context.fillRect(img.width - 6, img.height - 7, 1, 3);
            context.fillRect(img.width - 4, img.height - 7, 1, 2);
            context.fillRect(img.width - 5, img.height - 3, 2, 1);
            callback(canvas.toDataURL());
        };
        img.src = url || chrome.extension.getURL('default.ico');
    }



    function generateMetaImages(tabProperties, url) {

        var faviconUrl,
            showPreview = gsStorage.fetchPreviewOption();

        if (showPreview) {
            gsStorage.fetchPreviewImage(url, function(previewUrl) {
                if (previewUrl !== null) {
                    document.getElementById('gsPreview').setAttribute('src', previewUrl);
                }
            });
        }

        /*gsStorage.fetchFavicon(gsStorage.getRootUrl(url), function(faviconUrl) {
            if (faviconUrl !== null) {
                console.log('found favicon:' + faviconUrl);
                document.getElementById('gsFavicon').setAttribute('href', faviconUrl);
            } else {
                console.log('could not locate favicon for:' + gsStorage.getRootUrl(url));
            }
        });*/
        generateFaviconUri(tabProperties.favicon, function(faviconUrl) {
            document.getElementById('gsFavicon').setAttribute('href', faviconUrl);
        });
    }

    function attemptTabSuspend() {

        var url = gsStorage.getHashVariable('url', window.location.hash),
            tabProperties = gsStorage.fetchTabFromHistory(url),
            rootUrlStr;

        //just incase the url is a suspension url (somehow??) then decode it
        if (url.indexOf('suspended.html#') >= 0) {
            url = gsStorage.getHashVariable('url', url.split('suspended.html')[1]);
        }

        //if we have some suspend information for this tab
        if (!tabProperties) {
            tabProperties = {url: url};
        }
        rootUrlStr = gsStorage.getRootUrl(tabProperties.url);

        //set favicon and preview image
        generateMetaImages(tabProperties, url);

        //populate suspended tab bar
        document.getElementById('gsTitle').innerText = tabProperties.title ? tabProperties.title : rootUrlStr;
        document.getElementById('gsTopBarTitle').innerText = tabProperties.title ? tabProperties.title : rootUrlStr;
     //   document.getElementById('gsTopBarUrl').innerText = tabProperties.url;
        document.getElementById('gsTopBarInfo').innerText = 'Tab suspended: ' + 'click to reload, or ';
        document.getElementById('gsWhitelistLink').innerText = 'add ' + rootUrlStr + ' to whitelist';
        document.getElementById('gsWhitelistLink').setAttribute('data-text', rootUrlStr);

        if (tabProperties.favicon) {
            document.getElementById('gsTopBarImg').setAttribute('src', tabProperties.favicon);
        } else {
            document.getElementById('gsTopBarImg').style.visibility = 'hidden';
        }

        //update url with actual url
        console.log('replacing state: ' + url);
        window.history.replaceState(null, null, url);
    }

    window.onload = function() {

        //handler for unsuspend
        document.onclick = unsuspendTab;

        //handler for whitelist
        document.getElementById('gsWhitelistLink').onclick = function(e) {
            gsStorage.saveToWhitelist(e.target.getAttribute('data-text'));
        };

        //mark tab as suspended
        sendSuspendedMessage();

        //try to suspend tab
        attemptTabSuspend();
    };

/*    window.onbeforeunload = function() {

        //update url with suspended url
        var url = gsStorage.generateSuspendedUrl(window.location.href);
        window.history.replaceState(null, null, url);
        document.body.style.cursor = 'wait';
    };
*/
}());
