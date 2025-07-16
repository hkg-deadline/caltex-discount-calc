let standardPrice = 0;
let premiumPrice = 0;
let discounts = [];
let coupons = [];

// Laod the config json file for discount cards and coupons
async function fetchConfig() {
    try {
        const discountCardsResponse = await fetch('config/discountcards.json');
        const couponsResponse = await fetch('config/coupons.json');
        const discountCardsConfig = await discountCardsResponse.json();
        const couponsConfig = await couponsResponse.json();

        discounts = discountCardsConfig.discounts;
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
        const couponSelect = document.getElementById('coupon');
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
        const response = await fetch('https://www.consumer.org.hk/pricewatch/oilwatch/opendata/oilprice.json');
        const data = await response.json();
        
        // Find Caltex prices
        const caltex = data.companies.find(company => company.company === 'Caltex');
        if (!caltex) {
            throw new Error('Caltex data not found');
        }

        // Store prices
        standardPrice = caltex.standardPrice ? parseFloat(caltex.standardPrice) : 0;
        premiumPrice = caltex.premiumPrice ? parseFloat(caltex.premiumPrice) : 0;

        // Update displayed price
        updatePriceDisplay();
        document.getElementById('lastUpdated').textContent = new Date(data.updateTime).toLocaleString();
    } catch (error) {
        document.getElementById('error').textContent = 'Error fetching prices: ' + error.message;
        document.getElementById('error').classList.remove('hidden');
    }
}

// Toggle custom discount input visibility
function toggleCustomDiscount() {
    const discountType = document.getElementById('discountType').value;
    const customDiscountDiv = document.getElementById('customDiscountDiv');
    customDiscountDiv.classList.toggle('hidden', discountType !== 'others');
}

// Calculate results
function calculateResults() {
    const petrolType = document.getElementById('petrolType').value;
    const discountType = document.getElementById('discountType').value;
    const couponType = document.getElementById('couponType').value;
    const customDiscount = parseFloat(document.getElementById('customDiscount').value) || 0;

    // Get list price
    const listPrice = petrolType === 'standard' ? standardPrice : premiumPrice;
    if (listPrice === 0) {
        document.getElementById('error').textContent = 'Price data not available.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }

    // Get Card discount
    let cardDiscount = 0;
    if (discountType === 'others') {
        cardDiscount = customDiscount;
    } else {
        const discountConfig = discounts.find(d => d.value === discountType);
        cardDiscount = petrolType === 'standard' ? discountConfig.standard : discountConfig.premium;
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
    const coupon = coupons.find(c => c.value === couponType);
    const couponValue = coupon ? coupon.amount : 0;
    const totalSpend = coupon ? coupon.spend : 350;

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
    const amountPaid = paidLiters * effectivePrice;

    // Calculate actual price and discount (per Liter)
    const actualPricePerLiter = amountPaid / totalLiters;
    const actualDiscountPerLiter = listPrice - actualPricePerLiter;
    // Display results
    document.getElementById('petrol').textContent = document.getElementById('petrolType').textContent;
    document.getElementById('listPrice').textContent = listPrice.toFixed(2);
    document.getElementById('totalLiters').textContent = totalLiters.toFixed(2);
    document.getElementById('freeLiters').textContent = freeLiters.toFixed(2);
    document.getElementById('paidLiters').textContent = paidLiters.toFixed(2);
    document.getElementById('amountPaid').textContent = amountPaid.toFixed(2);
    document.getElementById('actualPrice').textContent = actualPricePerLiter.toFixed(2);
    document.getElementById('actualDiscount').textContent = actualDiscountPerLiter.toFixed(2);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
}

// Fetch config and prices on page load
Promise.all([fetchConfig(), fetchPetrolPrices()]);