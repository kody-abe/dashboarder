const electron = window.require('electron');
const remote = electron.remote;
const net = remote.net;
const Modal = CarbonComponents.Modal;
const Loading = CarbonComponents.Loading;
const applicationStartingIndicator = Loading.create(document.getElementById('application-starting'));
const errorModal = Modal.create(document.getElementById('error-modal'));
const noConfigurationModal = Modal.create(document.getElementById('no-configuration-modal'));
const noInternetNotification = document.getElementById('no-internet-connection');

let currentWebviewPage = -1;
let setOverride = false;
let displayConfiguration = {
    webviewPages: [],
}

window.$ = window.jQuery = require('jquery');

function errorHandler(event) {
    let countdown = 30;

    errorModal.show();
    document.getElementById('error-info').innerText = event.message || event.reason.message;
    
    setInterval(() => {
        countdown--;

        if (countdown === 0) {
            location.reload();
        }

        document.getElementById('restart-countdown').innerText = countdown;
    }, 1000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('error', errorHandler);
window.addEventListener('unhandledrejection', errorHandler);

if (!remote.process.env.CLIENT_NAME) {
    throw new Error('CLIENT_NAME env var not set');
}else if (!remote.process.env.SERVER_ADDRESS) {
    throw new Error('SERVER_ADDRESS env var not set');
}

function gotoNextWebview() {
    const nextUp = document.getElementById('webview-next-up');
    const active = document.getElementById('webview-active');
    let unableToLoad;

    if (displayConfiguration.override) {
        currentWebviewPage = -1;

        if (!setOverride) {
            noConfigurationModal.hide();
            applicationStartingIndicator.end();
            active.setAttribute('src', displayConfiguration.override.url);

            async function onDomReady() {
                active.removeEventListener('dom-ready', onDomReady);
                await doOnLoadSteps(active, displayConfiguration.override);
            }

            active.addEventListener('dom-ready', onDomReady);
        }

        return setOverride = true;
    }

    setOverride = false;

    if (displayConfiguration.webviewPages.length === 0) {
        currentWebviewPage = -1;
        document.getElementById('no-configuration-modal-heading').innerText = remote.process.env.CLIENT_NAME;
        document.getElementById('no-configuration-modal-server-url').innerText = remote.process.env.SERVER_ADDRESS;
        return noConfigurationModal.show();
    }

    noConfigurationModal.hide();

    currentWebviewPage++;

    if (currentWebviewPage >= displayConfiguration.webviewPages.length) {
        currentWebviewPage = 0;
    }

    const pageToShow = displayConfiguration.webviewPages[currentWebviewPage];

    nextUp.setAttribute('src', pageToShow.url);

    async function onDomReady() {
        noInternetNotification.classList.remove('visible');
        clearTimeout(unableToLoad);
        nextUp.removeEventListener('dom-ready', onDomReady);
        active.removeEventListener('dom-ready', onDomReady);

        await doOnLoadSteps(nextUp, pageToShow);

        applicationStartingIndicator.end();
        nextUp.setAttribute('class', 'transition-active');
        setTimeout(() => {
            let scrollInt;

            nextUp.setAttribute('id', 'webview-active');
            nextUp.setAttribute('class', '');
            active.setAttribute('id', 'webview-next-up');
            active.setAttribute('src', 'about:blank');

            if (pageToShow.scrollOverTime) {
                if (!pageToShow.scrollOverTime.identifier) {
                    pageToShow.scrollOverTime = {
                        identifier: 'html'
                    }
                }

                nextUp.executeJavaScript(`scrollElem = document.querySelector('${pageToShow.scrollOverTime.identifier}'); scrollElem.scrollHeight`, (scrollHeight) => {
                    nextUp.executeJavaScript(`scrollElem = document.querySelector('${pageToShow.scrollOverTime.identifier}'); scrollElem.clientHeight`, (clientHeight) => {
                        const leftToScroll = scrollHeight - clientHeight;
                        const scrollEachInterval = leftToScroll / pageToShow.viewDuration;
                        const scrollEachInnerInterval = scrollEachInterval / 10;

                        scrollInt = setInterval(() => {
                            nextUp.executeJavaScript(`scrollElem = document.querySelector('${pageToShow.scrollOverTime.identifier}'); scrollElem.scrollTop += ${scrollEachInnerInterval}`);
                        }, 100);
                    });
                });
            }

            setTimeout(() => {
                if (scrollInt) {
                    clearInterval(scrollInt);
                }

                gotoNextWebview();
            }, pageToShow.viewDuration * 1000);
        }, 1500);
    }

    nextUp.addEventListener('dom-ready', onDomReady);

    unableToLoad = setTimeout(() => {
        noInternetNotification.classList.add('visible');
        nextUp.removeEventListener('dom-ready', onDomReady);
        active.removeEventListener('dom-ready', onDomReady);
        gotoNextWebview();
    }, 15000);
}

const onLoadSteps = {
    waitForElement: (webview, identifier) => {
        return new Promise((resolve) => {
            function waitForIt() {
                webview.executeJavaScript(`document.querySelector('${identifier}')`, async (result) => {
                    if (!result) {
                        await sleep(1000);
                        waitForIt();
                    } else {
                        resolve();
                    }
                });
            }

            waitForIt();
        });
    },
    sleep: async (webview, ms) => {
        await sleep(ms);
    },
    type: async (webview, identifier, textToType) => {
        return new Promise((resolve) => {
            webview.executeJavaScript(`elem = document.querySelector('${identifier}'); elem.focus(); elem.value = '${textToType}'; if (angular) {angular.element(elem).triggerHandler('input');}`, async (result) => {
                resolve();
            });
        });
    },
    click: async (webview, identifier) => {
        return new Promise((resolve) => {
            webview.executeJavaScript(`document.querySelector('${identifier}').click()`, async (result) => {
                resolve();
            });
        });
    }
}
const onLoadStepsIf = {
    url: async (webview, value) => {
        return value === webview.getURL();
    }
}

async function doOnLoadSteps(webview, pageToShow) {
    if (pageToShow.onLoadSteps) {
        for (const step of pageToShow.onLoadSteps) {
            if (onLoadSteps[step.step]) {
                let args = [webview];
                let shouldDoStep = true;

                if (step.args) {
                    args = args.concat(step.args);
                }

                if (step.if) {
                    for (const ifStep in step.if) {
                        if (onLoadStepsIf[ifStep]) {
                            shouldDoStep = await onLoadStepsIf[ifStep].call(this, webview, step.if[ifStep]);
                        } else {
                            throw new Error(`Invalid load step conditional '${ifStep}' for ${pageToShow.url}`);
                        }
                    }
                }

                if (shouldDoStep) {
                    await onLoadSteps[step.step].apply(this, args);
                }
            } else {
                throw new Error(`Invalid load step '${step.step}' for ${pageToShow.url}`);
            }
        }
    }
}

function loadDisplayConfiguration() {
    $.getJSON(`${process.env.SERVER_ADDRESS}/api/display-configuration?displayID=${process.env.CLIENT_NAME}`, (result) => {
        displayConfiguration = result;

        if (currentWebviewPage === -1) {
            gotoNextWebview();
        }
    });

    setInterval(loadDisplayConfiguration, 10000);
}

setTimeout(loadDisplayConfiguration, 3000);