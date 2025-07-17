let standardPrice = 0;
let premiumPrice = 0;
let discounts = [];
let coupons = [];

// Laod the config json file for discount cards and coupons
async function fetchConfig() {
    try {
        const discountCardsResponse = await fetch('./config/discountcards.json');
        const couponsResponse = await fetch('./config/coupons.json');
        const discountCardsConfig = await discountCardsResponse.json();
        const couponsConfig = await couponsResponse.json();

        discounts = discountCardsConfig.discountCards;
        coupons = couponsConfig.coupons;

        // Populate discountCard dropdown
        const discountSelect = document.getElementById('discountCards');
        discountSelect.innerHTML = '';
        discounts.forEach(discount => {
            const option = document.createElement('option');
            option.value = discount.id;
            option.textContent = discount.description;
            discountSelect.appendChild(option);
        });

        // Populate coupons dropdown
        const couponSelect = document.getElementById('coupons');
        couponSelect.innerHTML = '';
        coupons.forEach(coupon => {
            const option = document.createElement('option');
            option.value = coupon.id;
            option.textContent = coupon.description;
            couponSelect.appendChild(option);
        });
    } catch (error) {
        document.getElementById('error').textContent = 'Error loading configuration: ' + error.message;
        document.getElementById('error').classList.remove('hidden');
    }
}

/* Get the latest Caltex listed petrol price from Consumer Council
Data Spec: Open Data Portal https://data.gov.hk/en-data/dataset/cc-oilprice-oilprice */
async function fetchPetrolPrices() {
    try {
        const url = 'https://api.allorigins.win/get?url='+encodeURIComponent('https://www.consumer.org.hk/pricewatch/oilwatch/opendata/oilprice.json');
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ${response.status}');
        }
        const data = await response.json();
        var oilPriceData = JSON.parse(data.contents);

        // Find Caltex prices
        standardPrice = oilPriceData.find(fuelType => fuelType.type.en === "Standard Petrol").prices.find(price => price.vendor.en === "Caltex").price;
        premiumPrice = oilPriceData.find(fuelType => fuelType.type.en === "Premium Petrol").prices.find(price => price.vendor.en === "Caltex").price;

    } catch (error) {
        document.getElementById('error').textContent = 'Error fetching prices: ' + error.message;
        document.getElementById('error').classList.remove('hidden');
    }
}

// Toggle custom discount input visibility
function toggleCustomDiscount() {
    const discountCard = document.getElementById('discountCards').value;
    const customDiscountDiv = document.getElementById('customDiscountDiv');
    customDiscountDiv.classList.toggle('hidden', discountCard !== 'others');
}

// Calculate results
function calculateResults() {
    const petrol = document.getElementById('petrol').value;
    const discountCard = document.getElementById('discountCards').value;
    const coupon = document.getElementById('coupons').value;
    const customDiscount = parseFloat(document.getElementById('customDiscount').value) || 0;

    // Get list price
    let listPrice = petrol === 'standard' ? standardPrice : premiumPrice;
    if (listPrice === 0) {
        document.getElementById('error').textContent = 'Price data not available.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }

    // Get Card discount
    let cardDiscount = 0;
    if (discountCard === 'others') {
        cardDiscount = customDiscount;
    } else {
        const discountConfig = discounts.find(d => d.id === discountCard);
        cardDiscount = petrol === 'standard' ? discountConfig.standardDiscount : discountConfig.premiumDiscount;
    }
    // Validate card discount
    if (cardDiscount > listPrice) {
        document.getElementById('error').textContent = 'Discount cannot be greater than the list price.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }
    if (cardDiscount < 0) {
        document.getElementById('error').textContent = 'Discount cannot be negative.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }

    // Get coupon details
    const couponConfig = coupons.find(c => c.id === coupon);
    const couponValue = couponConfig ? couponConfig.discount : 0;
    const totalSpend = couponConfig ? couponConfig.spend : 350;

    // Calculate the total amount petrol requested, free petrol and paid petrol
    const totalLiters = totalSpend / listPrice;
    const paidLiters = (totalSpend - couponValue) / listPrice;
    const freeLiters = totalLiters - paidLiters;

    // Calculate discount price (Listed price - card's discount)
    const discountedPrice = listPrice - cardDiscount;
    if (discountedPrice <= 0) {
        document.getElementById('error').textContent = 'Discounted price cannot be zero or negative.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }

    // Calculate the actual amount paid in statement
    const amountPaid = paidLiters * discountedPrice;

    // Calculate actual price and discount (per Liter)
    const actualPricePerLiter = amountPaid / totalLiters;
    const actualDiscountPerLiter = listPrice - actualPricePerLiter;

    // Display results
    const petrolSelected = document.getElementById('petrol');
    const petrolSelectedIndex = petrolSelected.selectedIndex;

    document.getElementById('petrolSelected').textContent = petrolSelected.options[petrolSelectedIndex].text;
    document.getElementById('listPrice').textContent = Number(listPrice).toFixed(2);
    document.getElementById('totalLiters').textContent = Number(totalLiters).toFixed(3);
    document.getElementById('freeLiters').textContent = Number(freeLiters).toFixed(3);
    document.getElementById('paidLiters').textContent = Number(paidLiters).toFixed(3);
    document.getElementById('discountedPrice').textContent = Number(discountedPrice).toFixed(2);
    document.getElementById('amountPaid').textContent = Number(amountPaid).toFixed(2);
    document.getElementById('actualPrice').textContent = Number(actualPricePerLiter).toFixed(2);
    document.getElementById('actualDiscount').textContent = Number(actualDiscountPerLiter).toFixed(2);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
}

// Initialize theme, add event listeners, populate dropdowns, and fetch prices on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    fetchConfig();
    fetchPetrolPrices();
});