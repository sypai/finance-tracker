// src/js/utils/ui/categorySelect.js
import { appState } from '../state.js';
import { AVAILABLE_ICON_IDS, getDefaultIconId } from '../icons.js';

// --- Component State ---
let selectedCategoryId = 'cat-uncategorized'; // Default
let currentHighlightIndex = -1;
let isPopoverOpen = false;

// --- DOM Elements ---
let container, triggerBtn, popover, chevron,
    listView, searchInput, categoryList, createNewBtn,
    createView, newNameInput, iconPicker, selectedIconInput, saveBtn, cancelBtn,
    triggerIconEl, triggerNameEl, hiddenInput;

/**
 * Initializes the custom category select component.
 */
export function initCategorySelect() {
    container = document.getElementById('category-select-container');
    if (!container) return; // Component not present

    triggerBtn = document.getElementById('category-select-trigger');
    popover = document.getElementById('category-select-popover');
    chevron = document.getElementById('category-select-chevron');
    listView = document.getElementById('category-list-view');
    searchInput = document.getElementById('category-search-input');
    categoryList = document.getElementById('category-select-list');
    createNewBtn = document.getElementById('category-create-new-btn');
    createView = document.getElementById('category-create-view');
    newNameInput = document.getElementById('new-category-name');
    iconPicker = document.getElementById('new-category-icon-picker');
    selectedIconInput = document.getElementById('new-category-selected-icon');
    saveBtn = document.getElementById('category-save-create-btn');
    cancelBtn = document.getElementById('category-cancel-create-btn');
    triggerIconEl = document.getElementById('category-select-icon');
    triggerNameEl = document.getElementById('category-select-name');
    hiddenInput = document.getElementById('transactionCategoryId');

    bindCategorySelectEvents();
    renderIconPicker(); // Populate icon picker once on init
    renderCategoryList(); // Initial render of category list
    updateTriggerButton(); // Set initial trigger state
}

/**
 * Binds event listeners.
 */
function bindCategorySelectEvents() {
    triggerBtn.addEventListener('click', togglePopover);
    searchInput.addEventListener('input', () => renderCategoryList(searchInput.value));
    categoryList.addEventListener('click', handleCategorySelect);
    createNewBtn.addEventListener('click', showCreateView);
    cancelBtn.addEventListener('click', showListView);
    saveBtn.addEventListener('click', handleCreateCategory);
    iconPicker.addEventListener('click', handleIconSelect);

    // Keyboard navigation for list
    searchInput.addEventListener('keydown', handleSearchKeyDown);
    categoryList.addEventListener('keydown', handleListKeyDown); // Add listener to list for focus

    // Close popover when clicking outside
    window.addEventListener('click', (e) => {
        if (isPopoverOpen && !container.contains(e.target)) {
            closePopover();
        }
    });
}

/**
 * Public method to set the selected category.
 * @param {string} categoryId - The ID of the category to select.
 */
export function setSelectedCategory(categoryId) {
    const category = appState.categories.find(c => c.id === categoryId);
    selectedCategoryId = category ? category.id : 'cat-uncategorized'; // Fallback
    updateTriggerButton();
    updateHiddenInput();
}

// --- Popover Management ---
function togglePopover(e) {
    e.stopPropagation(); // Prevent window click listener from closing immediately
    isPopoverOpen ? closePopover() : openPopover();
}

// *** UPDATED openPopover function ***
function openPopover() {
    renderCategoryList(); // Re-render list
    showListView(); // Ensure list view

    // --- Calculate Positioning ---
    const triggerRect = triggerBtn.getBoundingClientRect();
    const modalContent = triggerBtn.closest('.modal-content'); // Get the modal scroll container
    const modalRect = modalContent.getBoundingClientRect();

    // Temporarily make popover visible off-screen to measure height accurately
    popover.style.visibility = 'hidden';
    popover.style.display = 'block'; // Need display block to measure
    popover.classList.remove('hidden'); // Ensure it's not display: none
    const popoverHeight = popover.offsetHeight;
    popover.style.visibility = ''; // Reset visibility
    popover.style.display = ''; // Reset display
    // --- End Measurement Hack ---


    // Calculate space available *within the modal*
    // Use modalContent.scrollTop to account for scrolling within the modal
    const spaceBelow = modalRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - modalRect.top;


    let shouldFlip = false;
    // Flip if not enough space below AND (either enough space above OR space above > space below)
    if (popoverHeight > spaceBelow && (popoverHeight <= spaceAbove || spaceAbove > spaceBelow)) {
         shouldFlip = true;
    }

    // Apply or remove flip class *before* making it fully visible
    popover.classList.toggle('is-flipped', shouldFlip);
    if (shouldFlip) {
        // Adjust popover position slightly if needed (using margin)
        popover.style.marginBottom = '0.5rem'; // Add space between trigger and flipped popover
        popover.style.marginTop = ''; // Remove top margin if flipping
    } else {
        popover.style.marginTop = '0.5rem'; // Default space below trigger
        popover.style.marginBottom = ''; // Remove bottom margin
    }
    // --- End Positioning Logic ---


    popover.classList.remove('hidden'); // Now make it display block/flex
    requestAnimationFrame(() => { // Trigger transition
        popover.classList.add('active');
        container.classList.add('open'); // For chevron rotation
    });
    searchInput.focus(); // Focus search input when opened
    isPopoverOpen = true;
}

// Ensure closePopover removes the flip class
function closePopover() {
    popover.classList.remove('active', 'is-flipped'); // Remove flip class on close
    container.classList.remove('open');
    popover.style.marginTop = ''; // Reset margins
    popover.style.marginBottom = ''; // Reset margins
    // Hide after transition ends
    setTimeout(() => {
        popover.classList.add('hidden');
        isPopoverOpen = false;
        currentHighlightIndex = -1; // Reset highlight
    }, 200); // Match CSS transition duration
}

// --- View Switching ---
function showListView() {
    createView.classList.add('hidden');
    listView.classList.remove('hidden');
    searchInput.value = ''; // Clear search on view switch
    renderCategoryList(); // Refresh list
    searchInput.focus();
}

function showCreateView() {
    listView.classList.add('hidden');
    createView.classList.remove('hidden');
    newNameInput.value = searchInput.value; // Pre-fill name from search
    selectedIconInput.value = getDefaultIconId(); // Reset icon selection
    highlightSelectedIcon();
    newNameInput.focus();
}

// --- Rendering ---
function renderCategoryList(filter = '') {
    const query = filter.toLowerCase().trim();
    categoryList.innerHTML = ''; // Clear existing items

    const filteredCategories = appState.categories
        .filter(cat => cat.name.toLowerCase().includes(query))
        .sort((a, b) => { // Keep Uncategorized at top if matches filter
            if (a.id === 'cat-uncategorized') return -1;
            if (b.id === 'cat-uncategorized') return 1;
            return a.name.localeCompare(b.name);
        });

    if (filteredCategories.length === 0 && query === '') {
        categoryList.innerHTML = `<p class="p-4 text-center text-sm text-text-secondary">No categories found.</p>`;
    } else {
        filteredCategories.forEach((cat, index) => {
            const item = document.createElement('div');
            item.className = 'category-select-item';
            item.dataset.id = cat.id;
            item.setAttribute('role', 'option');
            item.setAttribute('tabindex', '-1'); // Make focusable via JS
            item.innerHTML = `
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <use href="${cat.iconId || getDefaultIconId()}"></use>
                </svg>
                <span>${cat.name}</span>
            `;
            categoryList.appendChild(item);
        });
    }
    currentHighlightIndex = -1; // Reset highlight on re-render
}

function renderIconPicker() {
    iconPicker.innerHTML = ''; // Clear existing
    AVAILABLE_ICON_IDS.forEach(iconId => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.iconId = iconId;
        button.innerHTML = `
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <use href="${iconId}"></use>
            </svg>
        `;
        iconPicker.appendChild(button);
    });
}

function updateTriggerButton() {
    const category = appState.categories.find(c => c.id === selectedCategoryId) || appState.categories.find(c => c.id === 'cat-uncategorized');
    const iconHref = category.iconId || getDefaultIconId();
    
    // Update icon using <use> element's href
    triggerIconEl.querySelector('use').setAttribute('href', iconHref);
    triggerNameEl.textContent = category.name;
}

function updateHiddenInput() {
    hiddenInput.value = selectedCategoryId;
}

// --- Event Handlers ---
function handleCategorySelect(e) {
    const item = e.target.closest('.category-select-item');
    if (item && item.dataset.id) {
        selectedCategoryId = item.dataset.id;
        updateTriggerButton();
        updateHiddenInput();
        closePopover();
    }
}

function handleIconSelect(e) {
    const button = e.target.closest('button');
    if (button && button.dataset.iconId) {
        selectedIconInput.value = button.dataset.iconId;
        highlightSelectedIcon();
    }
}

function highlightSelectedIcon() {
    const selectedId = selectedIconInput.value;
    iconPicker.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.iconId === selectedId);
    });
}

function handleCreateCategory() {
    const newName = newNameInput.value.trim();
    const selectedIcon = selectedIconInput.value || getDefaultIconId();

    if (!newName) {
        alert('Please enter a category name.');
        newNameInput.focus();
        return;
    }
    if (appState.categories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
        alert(`Category "${newName}" already exists.`);
        newNameInput.focus();
        return;
    }

    // Create and add to state
    const newCategory = {
        id: `cat-${Date.now()}`,
        name: newName,
        iconId: selectedIcon
    };
    appState.categories.push(newCategory);

    // Select the new category and update UI
    selectedCategoryId = newCategory.id;
    updateTriggerButton();
    updateHiddenInput();
    closePopover();
    // No need to call showListView, closePopover handles hiding.
}

// --- Keyboard Navigation ---
function handleSearchKeyDown(e) {
    const items = categoryList.querySelectorAll('.category-select-item');
    if (!isPopoverOpen || items.length === 0) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentHighlightIndex = 0; // Start at the first item
            highlightListItem(items);
            items[currentHighlightIndex].focus(); // Move focus to the list
            break;
        case 'Enter': // Allow Enter in search to potentially create new
             if (currentHighlightIndex === -1 && searchInput.value.trim()) {
                 // If no item is highlighted, Enter tries to create
                 showCreateView();
             } else if (currentHighlightIndex > -1) {
                // If item highlighted, Enter selects it
                items[currentHighlightIndex].click();
             }
            break;
        case 'Escape':
            closePopover();
            break;
    }
}

function handleListKeyDown(e) {
    const items = categoryList.querySelectorAll('.category-select-item');
    if (!isPopoverOpen || items.length === 0) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (currentHighlightIndex < items.length - 1) {
                currentHighlightIndex++;
                highlightListItem(items);
                items[currentHighlightIndex].focus();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (currentHighlightIndex > 0) {
                currentHighlightIndex--;
                highlightListItem(items);
                items[currentHighlightIndex].focus();
            } else {
                 // Move focus back to search input if at the top
                 currentHighlightIndex = -1;
                 highlightListItem(items); // Unhighlight
                 searchInput.focus();
            }
            break;
        case 'Enter':
        case ' ': // Allow Space to select
            e.preventDefault();
            if (currentHighlightIndex > -1) {
                items[currentHighlightIndex].click(); // Simulate click on highlighted item
            }
            break;
        case 'Escape':
            closePopover();
            break;
        case 'Tab': // Prevent tabbing out of the popover easily
             e.preventDefault();
             // Maybe cycle focus or just move to search/create button?
             searchInput.focus();
             break;
    }
}

function highlightListItem(items) {
    items.forEach(item => item.classList.remove('highlighted'));
    if (currentHighlightIndex > -1) {
        items[currentHighlightIndex].classList.add('highlighted');
        items[currentHighlightIndex].scrollIntoView({ block: 'nearest' });
    }
}