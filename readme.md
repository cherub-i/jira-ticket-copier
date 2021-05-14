# JIRA Ticket Copier

## Installation

1. [Install Tampermonkey](https://www.tampermonkey.net/)
2. open the JIRA Ticket Copier script file [`jira-ticket-copier.user.js`](https://github.com/cherub-i/jira-ticket-copier/raw/main/jira-ticket-copier.user.js)

## What it does
When you view a webpage from a JIRA server, every mentioning of a JIRA ticket on that page is adorned with magenta dot. Right-clicking on that element allows you to copy the information for that ticket to your clipboard - either as text or as a link.

Once you have the script installed in Tampermonkey, you can go to the editor-view for that script. At the top of the code you will find a block named "configuration". That's where you can do a bit of customization to your needs.