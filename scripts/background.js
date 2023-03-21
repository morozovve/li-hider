chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    console.log('Page uses History API and we heard a pushSate/replaceState.');
    console.log(details.tabId);
    console.log(details.url);
    if (details.url.match('https:\/\/.*.linkedin.com\/.*')) {
        chrome.tabs.sendMessage(details.tabId, {
            message: 'urlChanged'
        })
    }
});
