# Real x402 Flow Testing Checklist

## 🚀 Prerequisites

### Environment Setup:
- [ ] Development server running (`pnpm dev`)
- [ ] Database connected and running
- [ ] Wallet with Sepolia test ETH
- [ ] Environment variables set (INFURA_ID, ALCHEMY_ID)

### Test Data Setup:
- [ ] At least one API registered in the database
- [ ] Provider wallet configured
- [ ] Test API with reasonable price (e.g., 0.0001 ETH)

## 🧪 Test Steps

### 1. Server & API Tests
- [ ] Run `node test/quick-x402-test.js`
- [ ] Verify server responds correctly
- [ ] Check 402 Payment Required response

### 2. Frontend Manual Tests
- [ ] Open browser to `http://localhost:3000`
- [ ] Connect wallet (MetaMask/other)
- [ ] Navigate to API details page
- [ ] Verify API details display correctly

### 3. Payment Flow Tests
- [ ] Click "Pay & Call API" button
- [ ] Verify payment modal opens
- [ ] Check payment details are correct
- [ ] Verify button shows "Pay with Web3"
- [ ] Click to initiate payment

### 4. Web3 Transaction Tests
- [ ] Verify wallet opens with correct transaction details
- [ ] Check recipient address is correct
- [ ] Verify amount is correct
- [ ] Confirm network is Sepolia (or target network)
- [ ] Approve transaction in wallet

### 5. Transaction Processing Tests
- [ ] Verify "Sending Transaction..." status shows
- [ ] Wait for transaction confirmation
- [ ] Check that success message appears
- [ ] Verify "API successfully added to purchased list"
- [ ] Check for transaction hash display

### 6. Backend Verification Tests
- [ ] Check server logs for transaction verification
- [ ] Verify on-chain verification succeeds
- [ ] Check database for payment record
- [ ] Verify tokens are issued
- [ ] Check purchased API record creation

### 7. Post-Payment Tests
- [ ] Navigate to Purchased APIs page
- [ ] Verify API appears in purchased list
- [ ] Test calling the purchased API
- [ ] Navigate to Transaction History page
- [ ] Verify transaction appears in history

### 8. Transaction History Tests
- [ ] Click "Transactions" in header
- [ ] Verify transaction list loads
- [ ] Check transaction details (amount, status, date)
- [ ] Click "View on Explorer" link
- [ ] Verify it opens Etherscan with correct transaction

## 🔍 Expected Behaviors

### Payment Modal:
- Shows correct payment amount
- Displays provider wallet address
- Shows network information
- Button states update correctly

### Web3 Integration:
- Auto-switches to correct network
- Transaction details are accurate
- Error handling works (rejection, insufficient funds)

### Backend Processing:
- Verifies transaction on blockchain
- Validates recipient and amount
- Issues correct number of tokens
- Records real block data

### Transaction History:
- Shows real transaction hashes
- Displays correct verification status
- Links to blockchain explorers

## 🐛 Common Issues & Solutions

### TypeScript Errors:
- Check wallet client initialization
- Verify transaction parameter types

### Transaction Verification Fails:
- Ensure transaction is confirmed on blockchain
- Check recipient address matches exactly
- Verify amount is sufficient

### Network Issues:
- Ensure wallet is on correct network
- Check RPC provider configuration
- Verify environment variables

### Database Issues:
- Check database connection
- Verify API exists in database
- Ensure provider wallet is configured

## ✅ Success Criteria

The test is successful when:
1. User can complete real Web3 transaction
2. Transaction is verified on blockchain
3. Tokens are issued and API is added to purchased list
4. Transaction appears in history with real data
5. All error scenarios are handled gracefully

## 📝 Test Results

### Tests Passed:
- [ ] Server connectivity
- [ ] 402 Payment Required response
- [ ] Payment modal functionality
- [ ] Web3 transaction initiation
- [ ] Transaction verification
- [ ] Token issuance
- [ ] Purchased API creation
- [ ] Transaction history display

### Issues Found:
- [ ] List any issues encountered
- [ ] Document resolution steps

### Notes:
- [ ] Any additional observations
- [ ] Suggested improvements