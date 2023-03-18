let hiddenCnt = 0;
const setObservers = new Set();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(`Got msg: ${request.message}`)
        // listen for messages sent from background.js
        if (request.message === 'urlChanged') {
            if (setObservers.size == 0) {
                hiddenCnt = 0;
                console.log('waiting for element...')
                waitForElm(document, 'div[class*="jobs-search-results-list__pagination"]').then((elm) => {
                    console.log('Jobs are ready');
                    loadJobs();
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

function getJobFilterFunc(job) {
    function filterThisJob() {
        if (job.style.display == 'none') {
            if (setObservers.has(job.id)) {
                setObservers.delete(job.id);
            }
            return;
        }
        // Extracting data for filtering
        // Company class: <div> artdeco-entity-lockup__subtitle ember-view
        // Location class: <div> artdeco-entity-lockup__caption ember-view
        jobLoc = job.querySelector('div[class*="artdeco-entity-lockup__caption ember-view"]').textContent.trim();
        jobCompany = job.querySelector('div[class*="artdeco-entity-lockup__subtitle ember-view"]').textContent.trim();
        console.log("# Processing company:", jobCompany);

        // if matches condition on company/location:
        if (jobCompany == 'Synsel Techniek') { // TODO add condition
            job.style.display = 'none';
            hiddenCnt += 1;
        }

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
                alert('not found numRes aka small[class*="jobs-search-results-list__text"]')
            }
        } else {
            // TODO: add link to the ext page like "<a href=??> Job hiding settings </a>"
            counter.textContent = `Hidden jobs: ${hiddenCnt}/25`;
        }
        setObservers.delete(job.id);
        console.log(`#set: `, setObservers.size);
    }
    return filterThisJob;        
}

function loadJobs() {
    const jobs = document.body.querySelectorAll('li[class*="jobs-search-results__list-item"]');
    for (var i=0, max=jobs.length; i < max; i++) {
        if (jobs[i].textContent && jobs[i].textContent.trim()) {
            if (jobs[i].style.display !== 'none') {
                console.log(`Ready to filter: ${i}`);
                getJobFilterFunc(jobs[i])();
            }
        } else {
            if (!setObservers.has(jobs[i].id)) {
                console.log(`Set callback: ${i}`);
                onVisible(jobs[i], getJobFilterFunc(jobs[i]));
            }
        }
    }
}

waitForElm(document, 'div[class*="jobs-search-results-list__pagination"]').then((elm) => {
    console.log('Jobs are ready');
    loadJobs();
});

