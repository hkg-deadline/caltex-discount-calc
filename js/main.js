let prices = { standard: 0, premium: 0 };
let discountsData = [];
let couponsData = [];

// 1. Initialize: Load all data and setup the page
async function init() {
    try {
        // Fetch all files in parallel
        const [cardsRes, couponsRes, pricesRes] = await Promise.all([
            fetch('./config/discountcards.json'),
            fetch('./config/coupons.json'),
            fetch('./config/petrolprice.json')
        ]);

        const cardsConfig = await cardsRes.json();
        const couponsConfig = await couponsRes.json();
        const pricesConfig = await pricesRes.json();

        // Store data globally
        discountsData = cardsConfig.discountCards;
        couponsData = couponsConfig.coupons;
        prices.standard = pricesConfig.standard;
        prices.premium = pricesConfig.premium;

        // A. Fill the Discount Card dropdown initially
        populateDropdown('discountCards', discountsData);

        // B. Setup Event Listeners (This replaces inline HTML onchange events)
        setupEventListeners();

        // C. Initial Population of Coupons (based on default selections)
        updateCouponList();

    } catch (error) {
        showError('Error loading data: ' + error.message);
    }
}

// Logic to filter and update the Coupon dropdown
function updateCouponList() {
    const petrolType = document.getElementById('petrol').value;
    const cardId = document.getElementById('discountCards').value;
    const card = discountsData.find(d => d.id === cardId);
    
    // Filter the global couponsData array
    const filteredCoupons = couponsData.filter(coupon => {
        if (coupon.validFor && coupon.validFor.includes(petrolType) && coupon.validCardType && coupon.validCardType.includes(card.type)) return true;
        return false; // Default: Show all coupons
    });

    // Re-populate the dropdown with the filtered list
    populateDropdown('coupons', filteredCoupons);
}

// Calculation Logic
function calculateResults() {
    // Clear previous errors
    document.getElementById('error').classList.add('hidden');

    // Get Inputs
    const petrolType = document.getElementById('petrol').value;
    const cardId = document.getElementById('discountCards').value;
    const couponId = document.getElementById('coupons').value;
    const customVal = parseFloat(document.getElementById('customDiscount').value) || 0;

    // A. Determine List Price
    const listPrice = petrolType === 'standard' ? prices.standard : prices.premium;
    if (!listPrice) return showError('Price data unavailable.');

    // B. Determine Card Discount
    let cardDiscount = 0;
    if (cardId === 'others') {
        cardDiscount = customVal;
    } else {
        const card = discountsData.find(d => d.id === cardId);
        // Safety check if card is not found (e.g. data issue)
        if (!card) return; 
        cardDiscount = petrolType === 'standard' ? card.standardDiscount : card.premiumDiscount;
    }

    // Validation
    if (cardDiscount < 0 || cardDiscount > listPrice) {
        return showError('Invalid discount amount.');
    }

    // Determine Coupon Details
    const coupon = couponsData.find(c => c.id === couponId);
    const couponValue = coupon ? coupon.discount : 0;
    const totalSpend = coupon ? coupon.spend : 350; // Default spend if no coupon

    const discountedPrice = listPrice - cardDiscount;
    if (discountedPrice <= 0) return showError('Discounted price cannot be zero or less.');
    const totalLiters = totalSpend / listPrice;
    const paidLiters = (totalSpend - couponValue) / listPrice;
    const freeLiters = totalLiters - paidLiters;
    const amountPaid = paidLiters * discountedPrice;
    const actualPricePerLiter = amountPaid / totalLiters;
    const actualDiscountPerLiter = listPrice - actualPricePerLiter;

    updateResult('listPrice', listPrice);
    updateResult('totalLiters', totalLiters, 3);
    updateResult('freeLiters', freeLiters, 3);
    updateResult('paidLiters', paidLiters, 3);
    updateResult('discountedPrice', discountedPrice);
    updateResult('amountPaid', amountPaid);
    updateResult('actualPrice', actualPricePerLiter);
    updateResult('actualDiscount', actualDiscountPerLiter);

    const petrolSelect = document.getElementById('petrol');
    document.getElementById('petrolSelected').textContent = petrolSelect.options[petrolSelect.selectedIndex].text;
    document.getElementById('results').classList.remove('hidden');
}

// fill <select> elements
function populateDropdown(elementId, items) {
    const select = document.getElementById(elementId);
    
    // Save currently selected value to try and restore it after update
    const previousValue = select.value;
    
    select.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.description;
        select.appendChild(option);
    });

    // If the previously selected coupon is still in the new list, keep it selected.
    // Otherwise, it defaults to the first option.
    if (previousValue && Array.from(select.options).some(o => o.value === previousValue)) {
        select.value = previousValue;
    }
}

// UI Interaction: Show/Hide custom input
function toggleCustomDiscount() {
    const isOthers = document.getElementById('discountCards').value === 'starCard-others';
    const div = document.getElementById('customDiscountDiv');
    
    if (isOthers) div.classList.remove('hidden');
    else div.classList.add('hidden');
}

// Update text content with formatting
function updateResult(id, value, decimals = 2) {
    const el = document.getElementById(id);
    if(el) el.textContent = Number(value).toFixed(decimals);
}

// Show error messages
function showError(msg) {
    const el = document.getElementById('error');
    el.textContent = msg;
    el.classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('petrol').addEventListener('change', () => {
        updateCouponList();
    });

    document.getElementById('discountCards').addEventListener('change', () => {
        toggleCustomDiscount();
        updateCouponList();
    });

}

// Start
init();