// src/js/utils/ui/common.js
import { elements } from './domElements.js';


export function updateHeaderButtons(activeTabId) {
    const addAccountBtn = elements.addAccountBtn;
    const addInvestmentBtn = elements.addInvestmentBtn;

    // Show the "Add Bank Account" button only on the 'accounts' tab
    if (addAccountBtn) {
        addAccountBtn.style.display = activeTabId === 'accounts' ? 'inline-flex' : 'none';
    }

    // Show the "Add Investment" button only on the 'investments' tab
    if (addInvestmentBtn) {
        addInvestmentBtn.style.display = activeTabId === 'investments' ? 'inline-flex' : 'none';
    }
}

export function setActiveTab(tabId, createChartsCallback, appState) {
    elements.sidebarItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
    elements.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
    if (window.innerWidth <= 1024) { document.querySelector('.sidebar').classList.remove('active'); }
    if (createChartsCallback) {
        createChartsCallback(appState);
    }
}

export function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
    }
}

export function updateGreeting() {
    const hour = new Date().getHours();
    const name = "Suyash";
    let greetingText = "";

    if (hour < 12) {
        greetingText = `Good morning, ${name}.`;
    } else if (hour < 18) {
        greetingText = `Good afternoon, ${name}.`;
    } else {
        greetingText = `Good evening, ${name}.`;
    }
    elements.greetingTitle.textContent = greetingText;
    elements.greetingSubtitle.textContent = "Welcome back to your financial hub.";
}

export function updateDateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const timeString = now.toLocaleTimeString('en-IN', timeOptions);
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateString = now.toLocaleDateString('en-IN', dateOptions);

    if(elements.currentTime) {
        elements.currentTime.textContent = timeString;
    }
    if(elements.currentDate) {
        elements.currentDate.textContent = dateString;
    }
}