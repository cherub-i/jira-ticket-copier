// ==UserScript==
// @name        Jira Ticket Copier
// @namespace   https://github.com/cherub-i/jira-ticket-copier
// @version     0.1
// @description Use a right-click context menu to copy the Ticket-Key ("Id") and Ticket-Summary ("Title") either as a link or as text only for any ticket that appears on a JIRA page.
// @author      code@bastianbaumeister.de
// @match       https://*/jira/*
// @match       https://jira./*
// @icon        https://www.google.com/s2/favicons?domain=jira.atlassian.com
// @grant       none
// @require     https://raw.githubusercontent.com/cherub-i/jira-ticket-copier/main/context-menu.js
// ==/UserScript==

(function() {
    'use strict';

    class TicketInfo {
        constructor(element) {
            this.ready = false;
            this.id = "";
            this.issueUrl = "";
            this.issueKey = "";
            this.issueSummary = "";
            this.linkText = "";

            this.loadFromElement(element);
        }

        loadFromElement(element) {
            let found = false;
            
            if (element.className.search("issue-link") > -1) {
                if (element.parentNode.nodeName == "LI") {
                    // selector.push("a#key-val");                             
                    // issue detail / header https://JIRA_SERVER/browse/TICKET-485
                    //
                    // selector.push("a#parent_issue_summary");                
                    // issue detail / subticket header https://JIRA_SERVER/browse/TICKET-484
                    //
                    found = true;
                    this.issueUrl = element.href;
                    this.issueKey = element.innerText;
                    this.issueSummary = element.parentNode.parentNode.parentNode.childNodes[1].innerText;
                } else if (element.parentNode.nodeName == "P") {
                    // selector.push("div.user-content-block a.issue-link");   
                    // issue detail / desciption https://JIRA_SERVER/browse/TICKET-485
                    //
                    // selector.push("div.action-body a.issue-link");          
                    // issue detail / comment https://JIRA_SERVER/browse/TICKET-485
                    //
                    found = true;
                    this.issueUrl = element.href;
                    this.issueKey = element.innerText;
                    this.issueSummary = element.title;
                } else if (element.parentNode.nodeName == "SPAN") {
                    // selector.push("div.link-content a.issue-link");         
                    // issue detail / linked issues https://JIRA_SERVER/browse/TICKET-485
                    //
                    found = true;
                    this.issueUrl = element.href;
                    this.issueKey = element.innerText;
                    this.issueSummary = element.parentNode.innerText;
                } else if (element.parentNode.nodeName == "TD") {
                    // selector.push("td.issuekey>a.issue-link:not(.hidden-link)");              
                    // issue list https://JIRA_SERVER/issues/?filter=-2
                    //
                    found = true;
                    this.issueUrl = element.href;
                    this.issueKey = element.innerText;
                    this.issueSummary = element.parentNode.parentNode.querySelector("td.summary").innerText;
                }
            } else if (element.className.search("js-key-link") > -1) {
                if (element.parentNode.nodeName == "DIV") {
                    // selector.push("a.js-key-link");                         
                    // issue board / cards https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
                    //
                    found = true;
                    this.issueUrl = element.href;
                    this.issueKey = element.innerText;
                    this.issueSummary = element.parentNode.parentNode.childNodes[1].innerText;
                }
            } else if (element.id == "issuekey-val") {
                // selector.push("#issuekey-val");                         
                // issue board / detail pane / header https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
                //
                found = true;
                this.issueUrl = element.childNodes[0].href;
                this.issueKey = element.childNodes[0].innerText;
                this.issueSummary = element.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[1].innerText;
            }

            // selector.push("a.js-epic-key-link");                    // issue board / epic pane https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
            if (found) {
                this.id = this.issueUrl.substr(this.issueUrl.lastIndexOf("/")+1);
                if (isJiraIssueKey(this.id)) {
                    this.ready = true;
                } else {
                    console.log("ERROR | JIRA ticket copier | link element found with invalid issues key in URL: " + element)
                }
            } else {
                console.log("ERROR | JIRA ticket copier | link element found but in unsupported context: " + element)
            }
        }

        get link() {
            let link = "<a href='" + this.issueUrl + "'>" + this.issueKey + " " + this.issueSummary + "</a>";
            return link;
        }

        get text() {
            let text = this.issueKey + " " + this.issueSummary;
            return text;
        }
    }

    class ActionsMenu {
        constructor(id) {
            this.actionsMenu = document.createElement('button');

            this.actionsMenu.style.border = 'none';
            this.actionsMenu.style.marginLeft = '.3rem'; 
            this.actionsMenu.style.height = '13px';
            this.actionsMenu.style.width = '13px';
            this.actionsMenu.style.borderRadius = '50%';
            this.actionsMenu.style.backgroundColor = 'magenta'; // oder gelb? #FFE500

            this.actionsMenu.className = "actions-menu"
            this.actionsMenu.id = "am-" + id;
        }

        get element() {
            return this.actionsMenu
        }

        initMenu(items) {
            this.menu = new ContextMenu("#" + this.actionsMenu.id, items);
        }
    }
    
    function isJiraIssueKey(issueKey) {
        let jiraMatcher = /((?!([A-Z0-9a-z]{1,10})-?$)[A-Z]{1}[A-Z0-9]+-\d+)/g;
        return issueKey.match(jiraMatcher) !== null;
    }

    function copyToClip(str) {
        // https://stackoverflow.com/questions/23934656/javascript-copy-rich-text-contents-to-clipboard

        function listener(e) {
            e.clipboardData.setData("text/html", str);
            e.clipboardData.setData("text/plain", str);
            e.preventDefault();
        }
        document.addEventListener("copy", listener);
        document.execCommand("copy");
        document.removeEventListener("copy", listener);
    };

    function gatherTicketLinks() {
        // let selector = "a.issue-link,a.js-key-link,#issuekey-val"
        let selector = [];
        selector.push("a#key-val");                             // issue detail / header https://JIRA_SERVER/browse/TICKET-485
        selector.push("a#parent_issue_summary");                // issue detail / subticket header https://JIRA_SERVER/browse/TICKET-484
        selector.push("div.user-content-block a.issue-link");   // issue detail / desciption https://JIRA_SERVER/browse/TICKET-485
        selector.push("div.action-body a.issue-link");          // issue detail / comment https://JIRA_SERVER/browse/TICKET-485
        selector.push("div.link-content a.issue-link");         // issue detail / linked issues https://JIRA_SERVER/browse/TICKET-485
        selector.push("td.issuekey>a.issue-link:not(.hidden-link)");              // issue list https://JIRA_SERVER/issues/?filter=-2
        selector.push("a.js-key-link");                         // issue board / cards https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
        selector.push("#issuekey-val");                         // issue board / detail pane https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
        selector.push("a.js-epic-key-link");                    // issue board / epic pane https://JIRA_SERVER/secure/RapidBoard.jspa?rapidView=6294&view=detail&selectedIssue=TICKET-484&quickFilter=30822
        const idElements = document.querySelectorAll(selector.join(","));
        for (let i = 0; i < idElements.length; i += 1) {
            let ticketInfo = new TicketInfo(idElements[i]);
            
            if (ticketInfo.ready && idElements[i].parentNode.querySelectorAll(".actions-menu").length == 0) {
                let aMenu = new ActionsMenu(ticketInfo.id);
                
                idElements[i].parentNode.insertBefore(aMenu.element, idElements[i].nextSibling);

                let items = [
                    { name: 'Als Link kopieren', fn: function() { copyToClip(ticketInfo.link); }},
                    { name: 'Als Text kopieren', fn: function() { copyToClip(ticketInfo.text); }},
                ];
                aMenu.initMenu(items)
            }
        }
    }

    function worker() {
        try {
            gatherTicketLinks();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log("ERROR | JIRA ticket copier | unknown exception: " + e);
        }
    }

    // // load CSS
    // const my_css = GM_getResourceText("IMPORTED_CSS");
    // GM_addStyle(my_css);

    // continuously scan for new links
    setInterval(worker, 3*1000);

})();