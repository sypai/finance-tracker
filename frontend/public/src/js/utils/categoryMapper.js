// src/js/utils/categoryMapper.js

// The Category Mapper 🗺️ - Now stores icon IDs (including the #)
const CATEGORY_MAP = [
    { name: 'Income', keywords: ['salary', 'freelance', 'bonus', 'interest'], iconId: '#icon-income' },
    { name: 'Food & Dining', keywords: ['swiggy', 'zomato', 'restaurant', 'dinner', 'coffee'], iconId: '#icon-food' },
    { name: 'Shopping', keywords: ['shopping', 'amazon', 'movies'], iconId: '#icon-shopping' },
    { name: 'Groceries', keywords: ['groceries'], iconId: '#icon-groceries' },
    { name: 'Transport', keywords: ['uber', 'travel'], iconId: '#icon-transport' },
    { name: 'Bills & Utilities', keywords: ['utilities', 'netflix', 'pharmacy'], iconId: '#icon-bills' },
    { name: 'Home', keywords: ['rent'], iconId: '#icon-home' },
    { name: 'Fuel', keywords: ['fuel', 'petrol'], iconId: '#icon-fuel' }
];

const DEFAULT_ICON_ID = '#icon-default';

// The logic function - now returns an ID
export function getIconIdForDescription(description) {
    const desc = description.toLowerCase();
    const category = CATEGORY_MAP.find(cat =>
        cat.keywords.some(keyword => desc.includes(keyword))
    );
    return category ? category.iconId : DEFAULT_ICON_ID;
}