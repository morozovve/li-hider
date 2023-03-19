// chrome.tabs.onUpdated.addListener(
//     function(tabId, changeInfo, tab) {
//       if (changeInfo.url) {
//         chrome.tabs.sendMessage( tabId, {
//           message: 'urlChanged',
//           url: changeInfo.url
//         })
//       }
//     }
//   );

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    console.log('Page uses History API and we heard a pushSate/replaceState.');
    console.log(details.tabId);
    console.log(details.url);
    if (details.url.match('https:\/\/.*.linkedin.com\/.*')) {
        chrome.tabs.sendMessage(details.tabId, {
            message: 'urlChanged'
        })
    }
});
