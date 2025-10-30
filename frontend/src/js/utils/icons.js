// src/js/utils/icons.js

// Predefined list of available icon IDs for category creation.
// These should correspond to IDs within your (future) icons.svg sprite.
export const AVAILABLE_ICON_IDS = [
    '#icon-default', // Generic/Fallback
    '#icon-income', // Income/Salary
    '#icon-food', // Food, Dining
    '#icon-shopping', // Shopping, Retail
    '#icon-groceries', // Groceries
    '#icon-transport', // Transport, Travel
    '#icon-bills', // Bills, Utilities
    '#icon-home', // Home, Rent
    '#icon-fuel', // Fuel, Gas
    '#icon-health', // Health, Pharmacy
    '#icon-entertainment', // Entertainment, Movies
    '#icon-personal-care', // Personal Care
    '#icon-education', // Education
    '#icon-gifts', // Gifts, Donations
    '#icon-investment', // Investments (maybe transfers?)
    '#icon-cash', // Cash withdrawal/spending
    '#icon-credit-card', // Credit card payments
    // Add more relevant icons as needed
];

// Simple helper to get the default icon
export function getDefaultIconId() {
    return '#icon-default';
}