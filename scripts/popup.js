function isPopup() {
    console.log(`[DEBUG] Is popup? width: ${window.innerWidth}`);
    return window.innerWidth < 500;
}

function waitForElm(obj, selector) {
    return new Promise(resolve => {
        if (obj.querySelector(selector)) {
            return resolve(obj.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (obj.querySelector(selector)) {
                resolve(obj.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(obj, {
            childList: true,
            subtree: true
        });
    });
}

function goToExtPage() {
    chrome.tabs.create({ url: "index.html" });
}

function reloadPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
        chrome.tabs.reload(arrayOfTabs[0].id);
    });
}

function rmAllHidden() {
    muteds = Array();
    chrome.storage.local.set({ 'mutedArr': muteds }, () => {
        console.log('Stored new mutedArr');
    });
    reloadPage();
}

function getListElement(companyName) {
    // using bootstrap and container classes to align company name with the button
    // structure: 
    // 
    // <a class="border-0 list-group-item-action list-group-item-light text-decoration-none pb-1 pt-1" href="#">
    //     <div class="container">
    //         <div class="row ">
    //             <div class="col col-lg-1"></div>
    //             <div class="col">SAMPLE</div>
    //             <div class="col col-lg-2"><button class="btn btn-sm btn-outline-danger">Remove</button></div>
    //         </div>
    //     </div>
    // </a>

    let a = document.createElement('a');
    a.classList.add('border-0');
    a.classList.add('list-group-item-action');
    a.classList.add('list-group-item-light');
    a.classList.add('text-decoration-none');
    a.classList.add('pb-1');
    a.classList.add('pt-1');
    a.href = '#';

    let container = document.createElement("div")
    container.classList.add("container");
    a.appendChild(container);

    let row = document.createElement("div");
    row.classList.add("row");
    container.appendChild(row);

    if (!isPopup()) {
        let col0 = document.createElement("div");
        col0.classList.add("col");
        col0.classList.add("col-lg-1");
        row.appendChild(col0);
    }

    let col1 = document.createElement("div");
    col1.classList.add("col");
    if (isPopup()) {
        col1.classList.add("text-truncate");
    }
    col1.appendChild(document.createTextNode(companyName));
    row.appendChild(col1);

    let col2 = document.createElement("div");
    col2.classList.add("col");
    col2.classList.add("col-lg-2");
    let btn = document.createElement("button")
    btn.classList.add("btn");
    btn.classList.add("btn-sm");
    btn.classList.add("btn-outline-danger");
    btn.textContent = "Remove";
    col2.appendChild(btn);
    row.appendChild(col2);

    btn.onclick = function () {
        // remove company name from muteds
        if (muteds.includes(companyName)) {
            muteds = muteds.filter(item => item !== companyName)
            chrome.storage.local.set({ 'mutedArr': muteds }, () => {
                console.log('[INFO ] Stored new mutedArr');
            });
        }
        // update list
        a.remove()
    }
    return a;
}

function updateMutedList() {
    // crutch for now: short muted list for popup & full for extension page
    // how to find out: window.innerWidth

    if (muteds) {
        let mutedsList = muteds.slice().reverse().slice(0, muteds.length);
        if (isPopup()) {
            mutedsList = muteds.slice().reverse().slice(0, 4);
            waitForElm(document, 'button[id=goToExtBtn]').then((btn) => {
                if (muteds.length <= 4) {
                    btn.textContent = 'Go to Extension';
                }
            })
        }

        console.log(`[INFO ] list-to-show: ${mutedsList}`);
        let ul = document.getElementById("mutedList");
        mutedsList.forEach(company => {
            let listElement = getListElement(company);
            ul.appendChild(listElement);
        });
    }
}

function getMutedList() {
    // crutch for now; add Promise.then() later
    chrome.storage.local.get(['mutedArr'], (result) => {
        console.log('[INFO ] Retrieved: ' + result.mutedArr);
        if (result.mutedArr) {
            console.log('[INFO ] updated muteds: ' + result.mutedArr);
            muteds = result.mutedArr;
            updateMutedList();
        }
    });
}

waitForElm(document, 'button[id=goToExtBtn]').then((btn) => {
    btn.addEventListener("click", goToExtPage);
})
waitForElm(document, 'button[id=rmAllHidden]').then((btn) => {
    btn.addEventListener("click", rmAllHidden);
})

let muteds = Array();
getMutedList();