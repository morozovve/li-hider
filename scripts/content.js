let hiddenCnt = 0;
const setObservers = new Set();
muteds = Array()
const elemWhenJobsLoaded = 'div[class*="jobs-search-results-list__pagination"]';


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(`Got msg: ${request.message}`)
        // listen for messages sent from background.js
        if (request.message === 'urlChanged') {
            if (setObservers.size == 0 || true) {
                hiddenCnt = 0;
                console.log('waiting for jobs to load...')
                waitForElm(document, elemWhenJobsLoaded).then((elm) => {
                    console.log('Jobs are ready');
                    filterJobs();
                });
            } else {
                console.log('repeating request since setObservers.size > 0')
            }
        }
});

function waitForElm(obj, selector) {
    return new Promise(resolve => {
        if (obj.querySelector(selector)) {
            return resolve(obj.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (obj.querySelector(selector)) {
                console.log(`finished loading ${obj.querySelector(selector)}`);
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
    var observer = new MutationObserver(function(){
        if(element.textContent && element.textContent.trim()){
            callback();
        }
    });
    observer.observe(element, { attributes: true, childList: true });
    setObservers.add(element.id);
}

// Company class: <div> artdeco-entity-lockup__subtitle ember-view
function extractCompany(job) {
    jobCompany = job.querySelector('div[class*="artdeco-entity-lockup__subtitle ember-view"]');
    if (jobCompany) {
        return jobCompany.textContent.trim();
    } else {
        console.log(`[error]: got empty "jobCompany" from job ${job}`)
        return '';
    }
}

// Location class: <div> artdeco-entity-lockup__caption ember-view
function extractLocation(job) {
    jobLoc = job.querySelector('div[class*="artdeco-entity-lockup__caption ember-view"]')
    if (jobLoc) {
        return jobLoc.textContent.trim();
    } else {
        console.log(`[error]: got empty "jobLocation" from job ${job}`)
        return '';
    }
}

function muteCompany(job) {
    console.log('clicked mute button');
    let jobCompany = extractCompany(job);
    addCompanyToMuted(jobCompany);
}

function waitAndAddMuteBtn(job) {
    console.log(`job: ${job.id}`);
    waitForElm(job, 'button[class*="muted"]').then(() => {
        console.log('Adding late mute button');
        console.log(`Found LI mute button: ${job.querySelector('button[class*="muted"]')}`);
        addMuteBtn(job);
    });
}

function addMuteBtn(job) {
    li_btn = job.querySelector('button[class*="muted"]')
    if (!li_btn) {
        return;
    }
    muteBtn = document.createElement('button');
    muteBtn.innerHTML = 'Hide';
    muteBtn.style.zIndex = "100";
    muteBtn.classList.add("artdeco-pill--choice");
    muteBtn.classList.add("artdeco-pill--2");
    muteBtn.id = 'mute-button-' + job.id;
    // TODO figure out auto-switching to job even when we trying to hide it
    // job.style.pointerEvents = "none";
    // muteBtn.style.pointerEvents = "auto";
    console.log('adding mute button');
    muteBtn.onclick = function() {    
        muteCompany(job);
        // Or we can just go back when button is clicked so that we're 'staying' on the same job
        // history.back();
    };
    if (!job.querySelector(`button[id="${muteBtn.id}"]`)) {
        li_btn.insertAdjacentElement("afterend", muteBtn);
        console.log('added mute button');
    } else {
        console.log(`found existing mute button: ${job.querySelector(`button[id="${muteBtn.id}"]`)}`);
    }
}

function addCompanyToMuted(companyName) {
    muteds.push(companyName);
    console.log(`added company ${companyName} to ${muteds}`);
    chrome.storage.local.set({'mutedArr': muteds}, () => {
        console.log('Stored name: mutedArr');
    });
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
        if (numRes) {
            numRes.insertAdjacentElement("afterend", counter);
        } else {
            alert('not found numRes')
        }
    } else {
        // TODO: add link to the ext page like "<a href=??> Job hiding settings </a>"
        counter.textContent = `Hidden jobs: ${hiddenCnt}/25`;
    }
}

function filterJob(job) {
    let res = 0;
    if (job.style.display == 'none') {
        if (setObservers.has(job.id)) {
            setObservers.delete(job.id);
        }
        return 1;
    }
    // Extracting data for filtering
    jobLoc = extractLocation(job)
    jobCompany = extractCompany(job)
    console.log("# Processing company:", jobCompany);

    // if matches condition on company/location:
    if (muteds.includes(jobCompany)) { // TODO add condition
        job.style.display = 'none';
        res = 1;
    }
    setObservers.delete(job.id);
    console.log(`#set: `, setObservers.size);
    return res;
}

function filterJobs() {
    chrome.storage.local.get(['mutedArr'], (result) => {
        console.log('Retrieved: ' + result.mutedArr);
        if (result.mutedArr) {
            console.log('updated muteds: ' + result.mutedArr);
            muteds = result.mutedArr;
        }
    });

    const jobs = document.body.querySelectorAll('li[class*="jobs-search-results__list-item"]');
    for (var i=0, max=jobs.length; i < max; i++) {
        if (jobs[i].textContent && jobs[i].textContent.trim()) {
            if (jobs[i].style.display !== 'none') {
                console.log(`Ready to filter: ${i}`);
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
                console.log(`Set callback: ${i} for job ${job.id}`);
                let addfun = function() {
                    waitAndAddMuteBtn(job);
                };
                let filterfun = function() {
                    hiddenCnt += filterJob(job);
                }
                onVisible(job, function() {
                    addfun();
                    filterfun();
                    updateCounter();
                });
            }
        }
    }
}

waitForElm(document, elemWhenJobsLoaded).then((elm) => {
    console.log('Jobs are ready');
    filterJobs();
});

