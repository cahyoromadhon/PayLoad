import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Proxy from "@/models/Proxy";

function generateRandomId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        const { targetUrl, price, ownerAddress } = body;

        if (!targetUrl || !price === undefined || !ownerAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' }, 
                { status: 400 }
            );
        }

        let proxyPath = generateRandomId(6);
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const existing = await Proxy.findOne({ proxyPath });
            if (!existing) {
                isUnique = true;
            } else {
                proxyPath = generateRandomId(6);
                attempts++;
            }
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: 'Failed to generate unique proxyPath' },
                {  status: 500 }
            );
        }

        const newProxy = await Proxy.create({
            proxyPath,
            targetUrl,
            price,
            ownerAddress,
        });

        return NextResponse.json({
            success: true,
            data: {
                proxyPath: newProxy.proxyPath,
                fullUrl: `/api/proxy/${newProxy.proxyPath}`,
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating proxy:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}