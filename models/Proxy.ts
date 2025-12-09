// Kita perlu memberi tahu data seperti apa yang valid untuk disimpan di database
import mongoose, { Schema, model, models } from 'mongoose';

interface IProxy {
    proxyPath: string; // id unik link
    targetUrl: string; // url API client
    price: number; 
    ownerAddress: string; // wallet client
    isActive: boolean;
    createdAt: Date;
}

const ProxySchema = new Schema<IProxy>({ // aturan wajib oleh MongoDB
    proxyPath: {
        type: String,
        required: true,
        unique: true
    },
    targetUrl: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    ownerAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Proxy = models.Proxy || model<IProxy>('Proxy', ProxySchema);
// models.Proxy mengecek apakah model Proxy sudah ada di mongoose.models (untuk mencegah overwrite model saat hot-reload di development)

export default Proxy;