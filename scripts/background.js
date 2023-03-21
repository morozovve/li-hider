chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    console.log('[INFO ] Page uses History API and we heard a pushSate/replaceState.');
    if (details.url.match('https:\/\/.*.linkedin.com\/.*')) {
        chrome.tabs.sendMessage(details.tabId, {
            message: 'urlChanged'
        })
    }
});
