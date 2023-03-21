/*---------------------------------------*
 *---------  Utils are here -------------*
 *---------------------------------------*/
const elemWhenJobsLoaded = 'div[class*="jobs-search-results-list__pagination"]';
let hiddenCnt = 0;
const setObservers = new Set();

function extractCompany(job) {
    // Company class: <div> artdeco-entity-lockup__subtitle ember-view
    jobCompany = job.querySelector('div[class*="artdeco-entity-lockup__subtitle ember-view"]');
    if (jobCompany) {
        return jobCompany.textContent.trim();
    } else {
        console.log(`[ERROR] got empty "jobCompany" from job ${job}`)
        return '';
    }
}

function extractLocation(job) {
    // Location class: <div> artdeco-entity-lockup__caption ember-view
    jobLoc = job.querySelector('div[class*="artdeco-entity-lockup__caption ember-view"]')
    if (jobLoc) {
        return jobLoc.textContent.trim();
    } else {
        console.log(`[ERROR] got empty "jobLocation" from job ${job}`)
        return '';
    }
}

function setMuteds(muteds) {
    chrome.storage.local.set({ 'mutedArr': muteds }, () => {
        console.log('[INFO ] Stored mutedArr to local storage');
    });
}

function getMutedsWithPromise(sKey) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get(sKey, function (items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(items[sKey]);
            }
        });
    });
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

function onVisible(element, callback) {
    var observer = new MutationObserver(function () {
        if (element.textContent && element.textContent.trim()) {
            callback();
        }
    });
    observer.observe(element, { attributes: true, childList: true });
}

function resetCounter() {
    hiddenCnt = 0;
}

/*---------------------------------------*
 *---------  End of Utils ---------------*
 *---------------------------------------*/

/*---------------------------------------*
 *---------  Listeners are here ---------*
 *---------------------------------------*/

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(`[INFO ] Got msg: ${request.message}`)
        // listen for messages sent from background.js
        if (request.message === 'urlChanged') {
            console.log('[INFO ] Waiting for jobs to load...')
            waitAndFilterJobs();
        }
    });

/*---------------------------------------*
 *---------  End of Listeners -----------*
 *---------------------------------------*/
muteds = Array()

function waitAndFilterJobs() {
    resetCounter();
    waitForElm(document, elemWhenJobsLoaded).then((elm) => {
        console.log('[INFO ] Jobs are ready');
        getMutedsWithPromise('mutedArr').then(
            (mutedArr) => {
                console.log(`[DEBUG] loaded muteds: ${mutedArr}`);
                muteds = mutedArr;
                filterJobs();
            }
        );
    });
}

function muteCompany(job) {
    let jobCompany = extractCompany(job);
    addCompanyToMuted(jobCompany);
}

function waitAndAddMuteBtn(job) {
    waitForElm(job, 'button[class*="muted"]').then(() => {
        console.log(`[INFO ] Found LI mute button: ${job.querySelector('button[class*="muted"]')}`);
        console.log('[INFO ] Adding late mute button...');
        addMuteBtn(job);
    });
}

function addMuteBtn(job) {
    li_btn = job.querySelector('button[class*="muted"]')
    if (!li_btn) {
        console.log(`[ERROR] Cant add mute button: LI mute button not found for job ${job.id}`);
        return;
    }
    
    muteBtn = document.createElement('button');
    muteBtn.innerHTML = 'Hide';
    muteBtn.style.zIndex = "100";
    muteBtn.classList.add("artdeco-pill--choice");
    muteBtn.classList.add("artdeco-pill--2");
    muteBtn.id = 'mute-button-' + job.id;
    
    
    muteBtn.onclick = function () {
        // TODO figure out how to disable auto-switching to job even when we trying to hide it
        // tried: job.style.pointerEvents = "none";
        // tried: muteBtn.style.pointerEvents = "auto";
        // Or we can just go back when button is clicked so that we're 'staying' on the same job
        // tried: history.back(); works poorly
        muteCompany(job);
    };

    if (!job.querySelector(`button[id="${muteBtn.id}"]`)) {
        console.log('[INFO ] Adding mute button');
        li_btn.insertAdjacentElement("afterend", muteBtn);
    }
}

function addCompanyToMuted(companyName) {
    if (muteds.includes(companyName)) {
        console.log(`[WARN ] company ${companyName} is already in ${muteds}`);
    } else {
        muteds.push(companyName);
        console.log(`[INFO ] added company ${companyName} to ${muteds}`);
    }
    setMuteds(muteds);
    waitAndFilterJobs();
}

function updateCounter() {
    counter = document.getElementById('hidden-jobs-counter');
    if (!counter) {
        counter = document.createElement("p");
        counter.setAttribute("id", "hidden-jobs-counter");
        counter.classList.add("font-weight-light");
        counter.style.color = "#ffffff";
        counter.style.fontSize = "12px";
        counter.textContent = `Hidden jobs: ${hiddenCnt}/25`;

        numRes = document.querySelector('small[class*="jobs-search-results-list__text"]');
        numRes.insertAdjacentElement("afterend", counter);
    } else {
        // TODO: add link to the ext page like "<a href=??> Job hiding settings </a>"
        counter.textContent = `Hidden jobs: ${hiddenCnt}/25`;
    }
}

function filterJob(job) {
    console.log(`[INFO ] filterJob: ${job.id}`);
    let res = 0;
    if (job.style.display == 'none') {
        // We've already muted & counted this job, skipping
        if (setObservers.has(job.id)) {
            setObservers.delete(job.id);
        }
        return 0;
    }

    // Extracting data for filtering
    jobLoc = extractLocation(job)
    jobCompany = extractCompany(job)
    console.log("[INFO ] Processing company:", jobCompany);

    // if matches condition on company/location:
    if (muteds.includes(jobCompany)) { // TODO add condition
        job.style.display = 'none';
        res = 1;
        console.log('[INFO ] Company is in skip-list');
    } else {
        console.log('[INFO ] Company is not in skip-list');
    }
    setObservers.delete(job.id);
    return res;
}

function filterJobs() {
    const jobs = document.body.querySelectorAll('li[class*="jobs-search-results__list-item"]');
    for (var i = 0, max = jobs.length; i < max; i++) {
        if (jobs[i].textContent && jobs[i].textContent.trim()) {
            if (jobs[i].style.display !== 'none') {
                console.log(`[INFO ] Ready to filter job ${jobs[i].id}`);
                addMuteBtn(jobs[i]);
                hiddenCnt += filterJob(jobs[i]);
                updateCounter();
            } else {
                hiddenCnt += 1;
                updateCounter();
            }
        } else {
            if (!setObservers.has(jobs[i].id)) {
                let job = jobs[i];
                console.log(`[INFO ] Set callback for job ${job.id}`);
                onVisible(job, function () {
                    waitAndAddMuteBtn(job)
                    hiddenCnt += filterJob(job)
                    updateCounter();
                });
                setObservers.add(job.id);
            }
        }
    }
}

waitAndFilterJobs();