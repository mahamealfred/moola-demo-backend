/**
 * Dummy Payment Data for Testing
 * This file contains mock data for all payment services without calling third-party APIs
 * Use this data for validation and testing purposes only
 */

export const DUMMY_PAYMENT_DATA = {
  // Airtime Services - 5 dummy entries
  airtime: [
    {
      id: 'airtime_001',
      phoneNumber: '250788123456',
      provider: 'MTN',
      amount: 2000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-AIR-001',
      timestamp: '2025-01-15T10:30:00Z',
      customerName: 'Jean Nshimiyimana',
      productId: 'airtime',
    },
    {
      id: 'airtime_002',
      phoneNumber: '250701234567',
      provider: 'AIRTEL',
      amount: 5000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-AIR-002',
      timestamp: '2025-01-15T11:15:00Z',
      customerName: 'Uwishake Marie',
      productId: 'airtime',
    },
    {
      id: 'airtime_003',
      phoneNumber: '250712345678',
      provider: 'RURA',
      amount: 1000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-AIR-003',
      timestamp: '2025-01-15T12:00:00Z',
      customerName: 'Pierre Kabushesha',
      productId: 'airtime',
    },
    {
      id: 'airtime_004',
      phoneNumber: '250723456789',
      provider: 'MTN',
      amount: 3500,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-AIR-004',
      timestamp: '2025-01-15T13:45:00Z',
      customerName: 'Iyubizura Fidele',
      productId: 'airtime',
    },
    {
      id: 'airtime_005',
      phoneNumber: '250734567890',
      provider: 'AIRTEL',
      amount: 2500,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-AIR-005',
      timestamp: '2025-01-15T14:20:00Z',
      customerName: 'Habiba Rahman',
      productId: 'airtime',
    },
  ],

  // Electricity Services - 5 dummy entries
  electricity: [
    {
      id: 'elec_001',
      customerId: 'EWSA0123456789',
      amount: 25000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-ELEC-001',
      timestamp: '2025-01-15T09:00:00Z',
      customerName: 'Rwanda Electricity',
      serviceType: 'EWSA',
      meterNumber: 'MTR-123456',
      productId: 'electricity',
    },
    {
      id: 'elec_002',
      customerId: 'EWSA0987654321',
      amount: 50000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-ELEC-002',
      timestamp: '2025-01-15T10:15:00Z',
      customerName: 'Electrical Kigali',
      serviceType: 'EWSA',
      meterNumber: 'MTR-654321',
      productId: 'electricity',
    },
    {
      id: 'elec_003',
      customerId: 'EWSA1122334455',
      amount: 15000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-ELEC-003',
      timestamp: '2025-01-15T11:30:00Z',
      customerName: 'Power Consumer',
      serviceType: 'EWSA',
      meterNumber: 'MTR-112233',
      productId: 'electricity',
    },
    {
      id: 'elec_004',
      customerId: 'EWSA5566778899',
      amount: 35000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-ELEC-004',
      timestamp: '2025-01-15T12:45:00Z',
      customerName: 'Urban Electric',
      serviceType: 'EWSA',
      meterNumber: 'MTR-556677',
      productId: 'electricity',
    },
    {
      id: 'elec_005',
      customerId: 'EWSAAABBCCDD',
      amount: 20000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-ELEC-005',
      timestamp: '2025-01-15T13:20:00Z',
      customerName: 'Home Power Ltd',
      serviceType: 'EWSA',
      meterNumber: 'MTR-AABBCC',
      productId: 'electricity',
    },
  ],

  // Water Services (WASAC) - 5 dummy entries
  water: [
    {
      id: 'water_001',
      customerId: 'WASAC001234567',
      amount: 10000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-WATER-001',
      timestamp: '2025-01-15T08:00:00Z',
      customerName: 'Kigali Water Consumer',
      serviceType: 'WASAC',
      accountNumber: 'ACC-001234',
      productId: 'water',
    },
    {
      id: 'water_002',
      customerId: 'WASAC987654321',
      amount: 15000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-WATER-002',
      timestamp: '2025-01-15T09:30:00Z',
      customerName: 'Huye Water Account',
      serviceType: 'WASAC',
      accountNumber: 'ACC-987654',
      productId: 'water',
    },
    {
      id: 'water_003',
      customerId: 'WASAC5544332211',
      amount: 8000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-WATER-003',
      timestamp: '2025-01-15T10:45:00Z',
      customerName: 'Musanze Water',
      serviceType: 'WASAC',
      accountNumber: 'ACC-554433',
      productId: 'water',
    },
    {
      id: 'water_004',
      customerId: 'WASAC1122334455',
      amount: 12000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-WATER-004',
      timestamp: '2025-01-15T11:20:00Z',
      customerName: 'Gitarama Water Supply',
      serviceType: 'WASAC',
      accountNumber: 'ACC-112233',
      productId: 'water',
    },
    {
      id: 'water_005',
      customerId: 'WASACAABBCCDD11',
      amount: 20000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-WATER-005',
      timestamp: '2025-01-15T12:00:00Z',
      customerName: 'Industrial Water User',
      serviceType: 'WASAC',
      accountNumber: 'ACC-AABBCC',
      productId: 'water',
    },
  ],

  // Pay TV Services - 5 dummy entries
  paytv: [
    {
      id: 'paytv_001',
      customerId: 'MYTV123456789',
      amount: 8000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TV-001',
      timestamp: '2025-01-15T07:30:00Z',
      customerName: 'MyTV Subscriber 1',
      serviceType: 'MYTV',
      subscriberNumber: 'SUB-001234',
      productId: 'paytv',
    },
    {
      id: 'paytv_002',
      customerId: 'MYTV987654321',
      amount: 12000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TV-002',
      timestamp: '2025-01-15T08:45:00Z',
      customerName: 'MyTV Subscriber 2',
      serviceType: 'MYTV',
      subscriberNumber: 'SUB-987654',
      productId: 'paytv',
    },
    {
      id: 'paytv_003',
      customerId: 'MYTV5566778899',
      amount: 10000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TV-003',
      timestamp: '2025-01-15T09:15:00Z',
      customerName: 'MyTV Subscriber 3',
      serviceType: 'MYTV',
      subscriberNumber: 'SUB-556677',
      productId: 'paytv',
    },
    {
      id: 'paytv_004',
      customerId: 'MYTV1122334455',
      amount: 15000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TV-004',
      timestamp: '2025-01-15T10:00:00Z',
      customerName: 'MyTV Subscriber 4',
      serviceType: 'MYTV',
      subscriberNumber: 'SUB-112233',
      productId: 'paytv',
    },
    {
      id: 'paytv_005',
      customerId: 'MYTVPREMIUM01',
      amount: 20000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TV-005',
      timestamp: '2025-01-15T10:30:00Z',
      customerName: 'MyTV Premium User',
      serviceType: 'MYTV',
      subscriberNumber: 'SUB-PREM01',
      productId: 'paytv',
    },
  ],

  // Tax Services (RRA) - 5 dummy entries
  tax: [
    {
      id: 'tax_001',
      customerId: 'RRA0123456789',
      amount: 100000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TAX-001',
      timestamp: '2025-01-15T06:00:00Z',
      customerName: 'Business A Ltd',
      serviceType: 'RRA',
      tinNumber: 'TIN-123456789',
      taxType: 'VAT',
      productId: 'tax',
    },
    {
      id: 'tax_002',
      customerId: 'RRA9876543210',
      amount: 250000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TAX-002',
      timestamp: '2025-01-15T07:00:00Z',
      customerName: 'Enterprise Corp',
      serviceType: 'RRA',
      tinNumber: 'TIN-987654321',
      taxType: 'INCOME_TAX',
      productId: 'tax',
    },
    {
      id: 'tax_003',
      customerId: 'RRA5544332211',
      amount: 150000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TAX-003',
      timestamp: '2025-01-15T08:30:00Z',
      customerName: 'Trading Company',
      serviceType: 'RRA',
      tinNumber: 'TIN-554433221',
      taxType: 'BUSINESS_TAX',
      productId: 'tax',
    },
    {
      id: 'tax_004',
      customerId: 'RRA1122334455',
      amount: 75000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TAX-004',
      timestamp: '2025-01-15T09:45:00Z',
      customerName: 'Retail Business',
      serviceType: 'RRA',
      tinNumber: 'TIN-112233445',
      taxType: 'VAT',
      productId: 'tax',
    },
    {
      id: 'tax_005',
      customerId: 'RRAAABBCCDDEE',
      amount: 500000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-TAX-005',
      timestamp: '2025-01-15T11:00:00Z',
      customerName: 'Large Corporation',
      serviceType: 'RRA',
      tinNumber: 'TIN-AABBCCDDEE',
      taxType: 'CORPORATE_TAX',
      productId: 'tax',
    },
  ],

  // Mobile Money - 5 dummy entries
  mobilemoney: [
    {
      id: 'momo_001',
      phoneNumber: '250788111111',
      amount: 5000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-MOMO-001',
      timestamp: '2025-01-15T14:00:00Z',
      senderName: 'Sender One',
      recipientName: 'Recipient One',
      platform: 'MOMO',
      productId: 'mobilemoney',
    },
    {
      id: 'momo_002',
      phoneNumber: '250799222222',
      amount: 10000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-MOMO-002',
      timestamp: '2025-01-15T14:30:00Z',
      senderName: 'Sender Two',
      recipientName: 'Recipient Two',
      platform: 'MOMO',
      productId: 'mobilemoney',
    },
    {
      id: 'momo_003',
      phoneNumber: '250780333333',
      amount: 7500,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-MOMO-003',
      timestamp: '2025-01-15T15:00:00Z',
      senderName: 'Sender Three',
      recipientName: 'Recipient Three',
      platform: 'MOMO',
      productId: 'mobilemoney',
    },
    {
      id: 'momo_004',
      phoneNumber: '250781444444',
      amount: 3000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-MOMO-004',
      timestamp: '2025-01-15T15:30:00Z',
      senderName: 'Sender Four',
      recipientName: 'Recipient Four',
      platform: 'MOMO',
      productId: 'mobilemoney',
    },
    {
      id: 'momo_005',
      phoneNumber: '250782555555',
      amount: 15000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-MOMO-005',
      timestamp: '2025-01-15T16:00:00Z',
      senderName: 'Sender Five',
      recipientName: 'Recipient Five',
      platform: 'MOMO',
      productId: 'mobilemoney',
    },
  ],

  // Internet/Startime Services - 5 dummy entries
  internet: [
    {
      id: 'internet_001',
      customerId: 'STARTIM001234',
      amount: 2000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-NET-001',
      timestamp: '2025-01-15T16:30:00Z',
      customerName: 'Internet User 1',
      serviceType: 'STARTIME',
      accountNumber: 'ACC-NET-001',
      productId: 'internet',
    },
    {
      id: 'internet_002',
      customerId: 'STARTIM567890',
      amount: 5000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-NET-002',
      timestamp: '2025-01-15T17:00:00Z',
      customerName: 'Internet User 2',
      serviceType: 'STARTIME',
      accountNumber: 'ACC-NET-002',
      productId: 'internet',
    },
    {
      id: 'internet_003',
      customerId: 'STARTIMAB1122',
      amount: 3500,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-NET-003',
      timestamp: '2025-01-15T17:30:00Z',
      customerName: 'Internet User 3',
      serviceType: 'STARTIME',
      accountNumber: 'ACC-NET-003',
      productId: 'internet',
    },
    {
      id: 'internet_004',
      customerId: 'STARTIMCD3344',
      amount: 1500,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-NET-004',
      timestamp: '2025-01-15T18:00:00Z',
      customerName: 'Internet User 4',
      serviceType: 'STARTIME',
      accountNumber: 'ACC-NET-004',
      productId: 'internet',
    },
    {
      id: 'internet_005',
      customerId: 'STARTIMEF5566',
      amount: 7000,
      currency: 'RWF',
      status: 'successful',
      transactionId: 'TRX-NET-005',
      timestamp: '2025-01-15T18:30:00Z',
      customerName: 'Internet User 5',
      serviceType: 'STARTIME',
      accountNumber: 'ACC-NET-005',
      productId: 'internet',
    },
  ],
};

/**
 * Get dummy validation data for a service
 * @param {string} billerCode - The biller/service code
 * @param {string} customerId - The customer ID
 * @returns {object} Dummy validation response
 */
export const getDummyValidationData = (billerCode, customerId) => {
  const billerMap = {
    airtime: 'airtime',
    electricity: 'electricity',
    water: 'water',
    WASAC: 'water',
    'RWANDA_WASAC': 'water',
    paytv: 'paytv',
    'PAY_TV': 'paytv',
    tax: 'tax',
    RRA: 'tax',
    mobilemoney: 'mobilemoney',
    internet: 'internet',
    startime: 'internet',
    STARTIME: 'internet',
  };

  const serviceKey = billerMap[billerCode] || billerCode.toLowerCase();
  const dummyData = DUMMY_PAYMENT_DATA[serviceKey];

  if (!dummyData) {
    return null;
  }

  // Find matching customer or return first entry
  const matchingData = dummyData.find(
    (d) => d.customerId === customerId || d.phoneNumber === customerId
  ) || dummyData[0];

  return {
    success: true,
    data: {
      pdtName: `${serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1)} Service`,
      customerAccountName: matchingData.customerName,
      vendMax: 500000,
      trxId: `TRX-${Date.now()}`,
      ...matchingData,
    },
  };
};

/**
 * Get dummy payment execution response
 * @param {string} billerCode - The biller/service code
 * @param {number} amount - Transaction amount
 * @returns {object} Dummy payment response
 */
export const getDummyPaymentResponse = (billerCode, amount) => {
  return {
    success: true,
    status: 'successful',
    data: {
      transactionId: `TRX-${Date.now()}`,
      billerCode,
      amount,
      currency: 'RWF',
      timestamp: new Date().toISOString(),
      message: 'Transaction completed successfully',
      reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    },
  };
};

/**
 * Get dummy transaction status
 * @param {string} transactionId - The transaction ID
 * @returns {object} Dummy status response
 */
export const getDummyTransactionStatus = (transactionId) => {
  return {
    success: true,
    status: 'successful',
    data: {
      trxId: transactionId,
      trxStatus: 'successful',
      timestamp: new Date().toISOString(),
      message: 'Transaction status retrieved successfully',
    },
  };
};

export default {
  DUMMY_PAYMENT_DATA,
  getDummyValidationData,
  getDummyPaymentResponse,
  getDummyTransactionStatus,
};
