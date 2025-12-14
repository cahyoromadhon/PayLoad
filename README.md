# PayLoad — Monetize Any API with x402

<img width="1557" height="864" alt="image" src="https://github.com/user-attachments/assets/28f38317-8825-46d5-bf77-77ebab978cd7" />

## Problem & Solution
- **Problem:** API developers often struggle to monetize their endpoints. Building a custom billing backend, payment verification, dashboards, and access control for every API is time-consuming and complex.
- **Solution:** PayLoad lets you monetize any API endpoint instantly via the x402 payment protocol. Paste your target API URL, set a price in ETH, and get a payment-gated proxy URL. Clients call your proxy; if no valid payment proof is provided, the server responds with HTTP 402 and payment instructions. Once payment is verified on-chain, the proxy forwards the request to your original API.

## What Is x402?
x402 is a pattern that standardizes paywalls for APIs using HTTP 402 “Payment Required”, paired with on-chain payment verification. Clients receive a 402 response with payment metadata, complete the payment, then retry with a payment proof (e.g., transaction hash) in headers to gain access.

## Key Features
- **One-click monetization:** Generate a unique proxy path for your API.
- **ETH pricing:** Set price per request in ETH.
- **HTTP 402 flow:** First request returns payment instructions; subsequent requests include payment proof.
- **Arbitrum-compatible:** Uses an RPC provider (Arbitrum Sepolia by default) for transaction verification.
- **Simple data model:** MongoDB stores proxy metadata (path, target URL, price, owner).

## Project Structure
- `app/api/create/route.ts`: Creates a monetized proxy for a target API with price and owner.
- `app/api/proxy/[proxyPath]/route.ts`: Payment-gated proxy that validates on-chain payment and forwards requests.
- `lib/mongodb.ts`: MongoDB connection helper (cached across hot reloads).
- `models/Proxy.ts`: Mongoose schema for proxy configuration.
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`: Next.js app shell and styles.

## How It Works
1. You create a proxy by posting your target API URL, price (in ETH), and owner wallet address.
2. PayLoad generates a unique `proxyPath` and stores the configuration.
3. Clients call `/api/proxy/{proxyPath}`.
4. If no payment proof is provided, the server returns HTTP 402 with `paymentDetails` (chain, contract, amount, and `orderId`).
5. Client pays the contract and retries the request with header `x-payment-tx: <transactionHash>`.
6. Server verifies the transaction on-chain and, if valid, forwards the request to your target API and returns its response.

## Setup
### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- A JSON-RPC endpoint for Arbitrum (Sepolia by default)

### Install
```bash
npm install
```

### Environment Variables
Create `.env.local` in the project root:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourPaymentContractAddress
```

## API Reference
### Create Proxy
- **Endpoint:** `POST /api/create`
- **Body (JSON):**
	- `targetUrl`: string — Your original API endpoint.
	- `price`: number — Price per request in ETH (e.g., `0.001`).
	- `ownerAddress`: string — Your wallet address (lowercase).
- **Response (201):**
```json
{
	"success": true,
	"data": {
		"proxyPath": "AbC123",
		"fullUrl": "/api/proxy/AbC123"
	}
}
```

### Proxy (Payment-Gated)
- **Endpoint:** `GET|POST /api/proxy/{proxyPath}`
- **Without payment proof:**
	- Returns `402 Payment Required` with payload:
```json
{
	"error": "Payment Required",
	"message": "Please pay the exact amount to the contract address to access this resource.",
	"paymentDetails": {
		"chaindId": 421614,
		"contractAddress": "0x...",
		"amount": 0.001,
		"currency": "ETH",
		"orderId": "0x<keccak(proxyPath)>"
	}
}
```
- **With payment proof:**
	- Send header `x-payment-tx: <transactionHash>`.
	- Server verifies the transaction via `RPC_URL` and forwards the request to `targetUrl`.
	- Returns upstream response with headers:
		- `x-proxy-serverd-by: PayLoad-Protocol`

## Usage Examples
### 1) Create a Monetized Proxy
```bash
curl -X POST \
	-H "Content-Type: application/json" \
	-d '{
				"targetUrl": "https://api.example.com/v1/data",
				"price": 0.001,
				"ownerAddress": "0xabc..."
			}' \
	http://localhost:3000/api/create
```

### 2) Call the Proxy (Expect 402)
```bash
curl -i http://localhost:3000/api/proxy/AbC123
```

### 3) After Paying, Retry with Proof
```bash
curl -X GET \
	-H "x-payment-tx: 0xYourTxHash" \
	http://localhost:3000/api/proxy/AbC123
```

## Payment Verification Notes
- Current MVP verifies:
	- Transaction exists and `status === 1` (success).
	- `txReceipt.to` matches `NEXT_PUBLIC_CONTRACT_ADDRESS`.
- For production, add:
	- Decode contract event logs to validate `orderId` and `amount`.
	- Enforce `from` address, timestamp windows, replay protection.
	- Optional: signature-based receipts (off-chain) to reduce chain queries.

## Development
### Run Dev Server
```bash
npm run dev
```

### Code Locations
- Proxy creation: `app/api/create/route.ts`
- Payment-gated proxy: `app/api/proxy/[proxyPath]/route.ts`
- DB connection: `lib/mongodb.ts`
- Model: `models/Proxy.ts`

## License
This repository is for demonstration purposes. Use at your own risk.

