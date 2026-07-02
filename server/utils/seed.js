require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const CashReceipt = require('../models/CashReceipt');
const PaymentVoucher = require('../models/PaymentVoucher');
const connectDB = require('../config/db');

const AMOUNT_IN_WORDS = {
  '1000': 'One Thousand Only',
  '2500': 'Two Thousand Five Hundred Only',
  '5000': 'Five Thousand Only',
  '7500': 'Seven Thousand Five Hundred Only',
  '10000': 'Ten Thousand Only',
  '15000': 'Fifteen Thousand Only',
  '20000': 'Twenty Thousand Only',
  '25000': 'Twenty Five Thousand Only',
  '30000': 'Thirty Thousand Only',
  '50000': 'Fifty Thousand Only',
  '75000': 'Seventy Five Thousand Only',
  '100000': 'One Lakh Only',
  '125000': 'One Lakh Twenty Five Thousand Only',
  '150000': 'One Lakh Fifty Thousand Only',
  '200000': 'Two Lakh Only',
  '300000': 'Three Lakh Only',
  '500000': 'Five Lakh Only',
};

function wordify(n) {
  const key = String(n);
  return AMOUNT_IN_WORDS[key] || `${n.toLocaleString('en-IN')} Only`;
}

const RECEIPTS = [
  { receivedFrom: 'Rajesh Sharma', purpose: 'Office Rent - May 2024', paymentMode: 'Bank Transfer', amount: 50000 },
  { receivedFrom: 'Priya Patel', purpose: 'Invoice INV-2024-001 Payment', paymentMode: 'UPI', amount: 25000 },
  { receivedFrom: 'Amit Singh', purpose: 'Consulting Fees - Project Alpha', paymentMode: 'Cheque', amount: 75000 },
  { receivedFrom: 'Sunita Verma', purpose: 'Advance Payment for Services', paymentMode: 'NEFT', amount: 100000 },
  { receivedFrom: 'Vikram Joshi', purpose: 'Software License Renewal', paymentMode: 'UPI', amount: 15000 },
  { receivedFrom: 'Ananya Gupta', purpose: 'Membership Fee - Annual', paymentMode: 'Cash', amount: 10000 },
  { receivedFrom: 'Deepak Kumar', purpose: 'Training Program Registration', paymentMode: 'Card', amount: 7500 },
  { receivedFrom: 'Meera Iyer', purpose: 'Website Development - Phase 1', paymentMode: 'RTGS', amount: 200000 },
  { receivedFrom: 'Rohan Deshmukh', purpose: 'Equipment Sale - Printer', paymentMode: 'Cash', amount: 2500 },
  { receivedFrom: 'Neha Kapoor', purpose: 'Marketing Campaign Contribution', paymentMode: 'IMPS', amount: 30000 },
  { receivedFrom: 'Suresh Reddy', purpose: 'Event Sponsorship - Tech Summit', paymentMode: 'Cheque', amount: 150000 },
  { receivedFrom: 'Kavita Nair', purpose: 'Annual Maintenance Contract', paymentMode: 'Bank Transfer', amount: 20000 },
  { receivedFrom: 'Manish Tiwari', purpose: 'Data Analytics Consulting', paymentMode: 'UPI', amount: 125000 },
  { receivedFrom: 'Pooja Jain', purpose: 'Domain & Hosting Renewal', paymentMode: 'Card', amount: 5000 },
  { receivedFrom: 'Arun Prakash', purpose: 'Security Deposit Refund', paymentMode: 'NEFT', amount: 300000 },
  { receivedFrom: 'Divya Menon', purpose: 'Content Writing Services', paymentMode: 'Cash', amount: 10000 },
  { receivedFrom: 'Harsh Mehta', purpose: 'Logo Design Fee', paymentMode: 'UPI', amount: 7500 },
  { receivedFrom: 'Lakshmi Narayanan', purpose: 'Cloud Services Subscription', paymentMode: 'Bank Transfer', amount: 20000 },
  { receivedFrom: 'Gaurav Bhatia', purpose: 'Employee Training - Batch 3', paymentMode: 'RTGS', amount: 50000 },
  { receivedFrom: 'Shweta Aggarwal', purpose: 'Copyright Licensing Fee', paymentMode: 'Cheque', amount: 100000 },
];

const VOUCHERS = [
  { paidTo: 'TechSolutions Pvt Ltd', purpose: 'Cloud Infrastructure - Monthly', paymentMode: 'Bank Transfer', amount: 35000 },
  { paidTo: 'ABC Office Supplies', purpose: 'Office Stationery', paymentMode: 'UPI', amount: 5000 },
  { paidTo: 'RentSecure Realty', purpose: 'Office Rent - May 2024', paymentMode: 'NEFT', amount: 45000 },
  { paidTo: 'Sparsh Catering Services', purpose: 'Team Lunch - Monthly Meeting', paymentMode: 'Cash', amount: 7500 },
  { paidTo: 'Vijay Electricals', purpose: 'Electrical Repairs - Server Room', paymentMode: 'Cash', amount: 3000 },
  { paidTo: 'FreshRoast Coffee Co.', purpose: 'Office Coffee Supplies', paymentMode: 'UPI', amount: 2500 },
  { paidTo: 'SafeGuard Insurance', purpose: 'Office Insurance Premium', paymentMode: 'Bank Transfer', amount: 25000 },
  { paidTo: 'Gleam Clean Services', purpose: 'Office Cleaning - Monthly', paymentMode: 'UPI', amount: 8000 },
  { paidTo: 'Ace Courier Services', purpose: 'Courier Charges - April', paymentMode: 'Cash', amount: 2000 },
  { paidTo: 'Digital Solutions Agency', purpose: 'Website Maintenance - Monthly', paymentMode: 'Bank Transfer', amount: 12000 },
  { paidTo: 'PowerGrid Utilities', purpose: 'Electricity Bill - May', paymentMode: 'NEFT', amount: 8500 },
  { paidTo: 'Prime Broadband', purpose: 'Internet & Networking - Monthly', paymentMode: 'UPI', amount: 4000 },
  { paidTo: 'PrintX Press', purpose: 'Business Card Printing', paymentMode: 'Card', amount: 3500 },
  { paidTo: 'LegalEagle Associates', purpose: 'Legal Retainer Fee - Q2', paymentMode: 'Cheque', amount: 30000 },
  { paidTo: 'ByteCare IT Services', purpose: 'IT Support - May 2024', paymentMode: 'Bank Transfer', amount: 15000 },
  { paidTo: 'Advance Tax Department', purpose: 'Advance Tax Payment - FY 2024-25', paymentMode: 'RTGS', amount: 150000 },
  { paidTo: 'Staff Welfare Committee', purpose: 'Employee Birthday Celebrations', paymentMode: 'Cash', amount: 6000 },
  { paidTo: 'Social Media Boost Inc', purpose: 'Social Media Ads - May Campaign', paymentMode: 'Card', amount: 20000 },
  { paidTo: 'TravelDesk Agency', purpose: 'Business Travel - Client Visit', paymentMode: 'UPI', amount: 18000 },
  { paidTo: 'SoftLic Global', purpose: 'Software License - MS Office 365', paymentMode: 'NEFT', amount: 22000 },
];

function randomDate(startDaysAgo, endDaysAgo) {
  const now = Date.now();
  const start = now - startDaysAgo * 86400000;
  const end = now - endDaysAgo * 86400000;
  return new Date(start + Math.random() * (end - start));
}

(async () => {
  await connectDB();

  // --------------- Seed single Admin user ---------------
  const adminEmail = 'admin@dreamcode.tech';
  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    console.log(`  Admin user already exists (${admin._id})`);
  } else {
    admin = await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', role: 'admin' });
    console.log(`  Created admin user ${admin.email} (${admin._id})`);
  }

  // --------------- Seed Cash Receipts ---------------
  const existingReceipts = await CashReceipt.countDocuments();
  if (existingReceipts > 2) {
    console.log(`\n[SKIP] ${existingReceipts} receipts already exist`);
  } else {
    console.log(`\nSeeding ${RECEIPTS.length} cash receipts...`);
    let count = 0;
    for (let i = 0; i < RECEIPTS.length; i++) {
      const r = RECEIPTS[i];
      const num = String(i + 1).padStart(4, '0');
      const receiptNumber = `RN${num}`;
      const existing = await CashReceipt.findOne({ receiptNumber });
      if (existing) {
        console.log(`  Receipt ${receiptNumber} already exists, skipping`);
        continue;
      }
      await CashReceipt.create({
        receiptNumber,
        date: randomDate(180, 0),
        receivedFrom: r.receivedFrom,
        purpose: r.purpose,
        paymentMode: r.paymentMode,
        amount: r.amount,
        amountInWords: wordify(r.amount),
        receivedBy: 'Admin',
        createdBy: admin._id,
      });
      count++;
    }
    console.log(`  Created ${count} new receipts`);
  }

  // --------------- Seed Payment Vouchers ---------------
  const existingVouchers = await PaymentVoucher.countDocuments();
  if (existingVouchers > 2) {
    console.log(`\n[SKIP] ${existingVouchers} vouchers already exist`);
  } else {
    console.log(`\nSeeding ${VOUCHERS.length} payment vouchers...`);
    let count = 0;
    for (let i = 0; i < VOUCHERS.length; i++) {
      const v = VOUCHERS[i];
      const num = String(i + 1).padStart(4, '0');
      const voucherNumber = `VN${num}`;
      const existing = await PaymentVoucher.findOne({ voucherNumber });
      if (existing) {
        console.log(`  Voucher ${voucherNumber} already exists, skipping`);
        continue;
      }
      await PaymentVoucher.create({
        voucherNumber,
        date: randomDate(180, 0),
        paidTo: v.paidTo,
        purpose: v.purpose,
        paymentMode: v.paymentMode,
        amount: v.amount,
        amountInWords: wordify(v.amount),
        approvedBy: 'Admin',
        createdBy: admin._id,
      });
      count++;
    }
    console.log(`  Created ${count} new vouchers`);
  }

  console.log('\nSeed complete!');
  await mongoose.disconnect();
  process.exit(0);
})();