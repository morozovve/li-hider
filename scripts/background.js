chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=>{
    chrome.tabs.query({
        active: true,
        currentWindow: true
    },(tabs)=>{
        if(changeInfo.url && tabId === tabs[0].id && changeInfo.url.match('https:\/\/.*.linkedin.com\/jobs\/search\/.*')) {
            chrome.tabs.sendMessage(tabId, {
                message: 'urlChanged'
            });
        };
    })
})