// src/js/utils/ui/tags.js
import { appState } from '../state.js'; // We need state to access/add tags

// --- Tag Component State ---
let selectedTags = [];
let currentHighlightIndex = -1;

// --- DOM Elements ---
let container, wrapper, searchInput, suggestionsList, hiddenInput;

// --- Color Helper (from state.js) ---
const TAG_COLORS = [
    '#F0857D', '#5BB974', '#1D4ED8',
    '#A78BFA', '#FBBF24', '#FB7185'
];
function getRandomTagColor() {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

/**
 * Initializes the tag input component.
 * Called once in app.js.
 */
export function initTagInput() {
    container = document.getElementById('tag-input-container');
    if (!container) return; // Component not on this page

    wrapper = document.getElementById('tag-input-wrapper');
    searchInput = document.getElementById('tagSearchInput');
    suggestionsList = document.getElementById('tag-suggestions-list');
    hiddenInput = document.getElementById('transactionTags');

    bindTagEvents();
}

/**
 * Binds all event listeners for the tag component.
 */
function bindTagEvents() {
    // Focus the text input when clicking anywhere in the wrapper
    wrapper.addEventListener('click', () => {
        searchInput.focus();
    });

    // Handle typing, navigation, and submission
    searchInput.addEventListener('keydown', handleSearchKeyDown);
    searchInput.addEventListener('input', updateSuggestions);

    // Handle clicking on a suggestion
    suggestionsList.addEventListener('mousedown', (e) => {
        // Use mousedown to fire before blur
        const item = e.target.closest('.tag-suggestion-item');
        if (item) {
            e.preventDefault();
            const tagName = item.dataset.name;
            addTag(getOrCreateTag(tagName));
        }
    });

    // Handle removing a pill
    wrapper.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-tag-btn');
        if (removeBtn) {
            const tagId = removeBtn.dataset.id;
            removeTag(tagId);
        }
    });

    // Close dropdown on blur
    searchInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions, 150); // Delay to allow click
    });
}

/**
 * Public method to set the selected tags (e.g., when editing a transaction).
 * @param {string[]} tagIds - An array of tag IDs.
 */
export function setSelectedTags(tagIds = []) {
    selectedTags = tagIds
        .map(id => appState.tags.find(t => t.id === id))
        .filter(Boolean); // Filter out any undefined/deleted tags
    
    renderPills();
    updateHiddenInput();
}

/**
 * Renders the .tag-pill elements from the selectedTags array.
 */
function renderPills() {
    // Clear all existing pills
    wrapper.querySelectorAll('.tag-pill').forEach(pill => pill.remove());

    // Re-add all selected tags
    selectedTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.style.backgroundColor = tag.color;
        pill.innerHTML = `
            <span>${tag.name}</span>
            <button type="button" class="remove-tag-btn" data-id="${tag.id}">&times;</button>
        `;
        // Insert pill before the search input
        wrapper.insertBefore(pill, searchInput);
    });
}

/**
 * Updates the hidden input value with comma-separated IDs.
 */
function updateHiddenInput() {
    hiddenInput.value = selectedTags.map(tag => tag.id).join(',');
}

/**
 * Adds a tag to the selected list, if it's not already added.
 * @param {object} tag - The tag object {id, name, color}
 */
function addTag(tag) {
    if (!tag || selectedTags.find(t => t.id === tag.id)) {
        searchInput.value = ''; // Clear input even if duplicate
        hideSuggestions();
        return; // Don't add duplicates
    }

    selectedTags.push(tag);
    renderPills();
    updateHiddenInput();
    
    searchInput.value = ''; // Clear input
    hideSuggestions();
}

/**
 * Removes a tag from the selected list.
 * @param {string} tagId - The ID of the tag to remove.
 */
function removeTag(tagId) {
    selectedTags = selectedTags.filter(tag => tag.id !== tagId);
    renderPills();
    updateHiddenInput();
}

/**
 * Checks appState for an existing tag. If not found, creates a new one.
 * @param {string} tagName - The name of the tag.
 * @returns {object} The existing or newly created tag object.
 */
function getOrCreateTag(tagName) {
    const name = tagName.trim();
    if (name.length === 0) return null;

    // Check for existing tag (case-insensitive)
    const existingTag = appState.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
        return existingTag;
    }

    // It's a new tag! Create it.
    const newTag = {
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name,
        color: getRandomTagColor()
    };
    
    // IMPORTANT: Mutate appState so it's available for the next transaction
    appState.tags.push(newTag);
    
    return newTag;
}

/**
 * Filters appState.tags and displays the suggestion dropdown.
 */
function updateSuggestions() {
    const query = searchInput.value.toLowerCase().trim();
    suggestionsList.innerHTML = ''; // Clear old suggestions

    if (query.length === 0) {
        hideSuggestions();
        return;
    }

    // Filter available tags
    const filteredTags = appState.tags.filter(tag => 
        tag.name.toLowerCase().includes(query) &&
        !selectedTags.find(t => t.id === tag.id) // Don't suggest already-selected tags
    );

    // Check if the exact query is a potential new tag
    const isExactMatch = appState.tags.some(t => t.name.toLowerCase() === query);
    
    // Add "Create new" option if no exact match and query is not empty
    if (!isExactMatch && query.length > 0) {
        suggestionsList.innerHTML += `
            <div class="tag-suggestion-item" data-name="${searchInput.value.trim()}">
                <span class="suggestion-name">Create "${searchInput.value.trim()}"</span>
                <span class="suggestion-new">New Tag</span>
            </div>
        `;
    }

    // Add filtered existing tags
    filteredTags.forEach(tag => {
        suggestionsList.innerHTML += `
            <div class="tag-suggestion-item" data-name="${tag.name}">
                <span class="suggestion-name">${tag.name}</span>
            </div>
        `;
    });

    if (suggestionsList.innerHTML.length > 0) {
        showSuggestions();
    } else {
        hideSuggestions();
    }
}

function showSuggestions() {
    suggestionsList.classList.add('active');
    currentHighlightIndex = -1; // Reset highlight
}

function hideSuggestions() {
    suggestionsList.classList.remove('active');
    currentHighlightIndex = -1;
}

/**
 * Handles keyboard events (Enter, Backspace, Arrow keys) in the search input.
 */
function handleSearchKeyDown(e) {
    const items = suggestionsList.querySelectorAll('.tag-suggestion-item');
    
    switch (e.key) {
        case 'Enter':
            e.preventDefault();
            if (currentHighlightIndex > -1 && items[currentHighlightIndex]) {
                // Add highlighted tag
                const tagName = items[currentHighlightIndex].dataset.name;
                addTag(getOrCreateTag(tagName));
            } else if (searchInput.value.trim().length > 0) {
                // Add tag from raw input value
                addTag(getOrCreateTag(searchInput.value));
            }
            break;

        case 'Backspace':
            if (searchInput.value.length === 0 && selectedTags.length > 0) {
                // If input is empty, remove the last pill
                e.preventDefault();
                removeTag(selectedTags[selectedTags.length - 1].id);
            }
            break;

        case 'ArrowDown':
            e.preventDefault();
            if (items.length > 0) {
                if (currentHighlightIndex < items.length - 1) {
                    currentHighlightIndex++;
                    highlightSuggestion(items);
                }
            }
            break;

        case 'ArrowUp':
            e.preventDefault();
            if (items.length > 0) {
                if (currentHighlightIndex > 0) {
                    currentHighlightIndex--;
                    highlightSuggestion(items);
                }
            }
            break;

        case 'Escape':
            hideSuggestions();
            break;
    }
}

/**
 * Highlights a suggestion item in the list based on the index.
 */
function highlightSuggestion(items) {
    items.forEach(item => item.classList.remove('highlighted'));
    items[currentHighlightIndex].classList.add('highlighted');
    items[currentHighlightIndex].scrollIntoView({ block: 'nearest' });
}