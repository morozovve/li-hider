document.getElementById("goToExtBtn").addEventListener("click", goToExtPage);

function goToExtPage() {
    var newURL = "index.html";
    chrome.tabs.create({ url: newURL });
};
