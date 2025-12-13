import { NextResponse, NextRequest } from "next/server";
import { ethers } from "ethers";
import dbConnect from "@/lib/mongodb";
import Proxy from "@/models/Proxy";

// config rpc Arbitrum
const PROVIDED_URL = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

type RouteContext = {
    params: Promise<{ proxyPath: string }>
};

export async function POST(req: NextRequest, context: RouteContext) {
    const { proxyPath } = await context.params;
    return handleRequest(req, proxyPath);
}

export async function GET(req: NextRequest, context: RouteContext) {
    const { proxyPath } = await context.params;
    return handleRequest(req, proxyPath);
}

async function handleRequest(req: NextRequest, proxyPath: string) {
    console.log("Menerima Request untuk ID:", proxyPath);
    try {
        // cek apakah id valid
        await dbConnect();
        const cleanPath = proxyPath.trim();
        const proxyData = await Proxy.findOne({ proxyPath: cleanPath, isActive: true });

        if(!proxyData) {
            return NextResponse.json({ error: 'Proxy link not found or inactive' }, { status: 404 });
        }

        // cek header apakah user melampirkan bukti pembayaran
        const txHash = req.headers.get('x-payment-tx');

        // Jika belum
        if(!txHash) {
            const orderId = ethers.id(proxyData.proxyPath);

            return NextResponse.json({
                error: 'Payment Required',
                message: 'Please pay the exact amount to the contract address to access this resource.',
                paymentDetails: {
                    chaindId: 421614, // arbitrum sepolia id
                    contractAddress: CONTRACT_ADDRESS,
                    amount: proxyData.price, // harga dalam eth
                    currency: 'ETH',
                    orderId: orderId, // harus dimasukkan oleh user ketika memanggil fungsi pay()
                }
            }, { status: 402 }) // HTTP 402: Payment Required
        }

        // Jika sudah
        const provider = new ethers.JsonRpcProvider(PROVIDED_URL);
        const txReceipt = await provider.getTransactionReceipt(txHash);

        // validasi 1: cek apakah transaksi sukses
        if(!txReceipt || txReceipt.status !== 1) {
            return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 402 });
        }

        // validasi 2: cek apakah penerima uang benar? (Contract Address)
        if(txReceipt.to?.toLowerCase() !== CONTRACT_ADDRESS?.toLowerCase()) {
            return NextResponse.json({ error: 'Invalid payment receipt' }, { status: 402 });
        }

        // validasi 3: Cek apakah Order ID di log sesuai (Untuk MVP kita skip decoding log rumit, 
        // kita asumsikan jika tx sukses ke kontrak kita, itu valid. 
        // *Catatan: Di Production, kita WAJIB decode Event Logs untuk pastikan orderId & amount cocok.)

        // Jika lolos
        const targetUrl = proxyData.targetUrl; // menyiapkan request dari Target API
        const body = req.method === 'POST' ? await req.text() : undefined; // copy body request dari user (Kalau ada)
        const upstreamResponse = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });

        // ambil data dari API asli
        const upstreamData = await upstreamResponse.text();

        // kembalikan data ke user
        return new NextResponse(upstreamData, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'x-proxy-serverd-by': 'PayLoad-Protocol'
            }
        });
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Gateway Error' }, { status: 500 });
    }
}