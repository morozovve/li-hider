function updateMutedList() {
    if (muteds) {
        console.log('updating list...');
        var ul = document.getElementById("mutedList");
        for (company of muteds) {
            var li = document.createElement("li");
            li.classList.add('list-group-item')
            li.appendChild(document.createTextNode(`${company}`));
            ul.appendChild(li);
        }
    }
}

function getMutedList() {
    chrome.storage.local.get(['mutedArr'], (result) => {
        console.log('Retrieved: ' + result.mutedArr);
        if (result.mutedArr) {
            console.log('updated muteds: ' + result.mutedArr);
            muteds = result.mutedArr;
            updateMutedList();
        }
    });
  
}

function goToExtPage() {
    var newURL = "index.html";
    chrome.tabs.create({ url: newURL });
};

popupBtn = document.getElementById("goToExtBtn")
if (popupBtn) {
    popupBtn.addEventListener("click", goToExtPage);
}
muteds = Array();
getMutedList();