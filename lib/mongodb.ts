import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

let cached = (global as any).mongoose; // membuat mongoose menjadi global sehingga akan tetap hidup selama server menyala

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
} // hanya memastikan jika cached belum ada, maka akan diinisialisasi manual sebagai object dengan properti conn dan promise

async function dbConnect() { // membuat sebuah fungsi async untuk menghubungkan ke database
    if (cached.conn) {
        return cached.conn;
    } // cek apakah koneksi sudah ada di cache, jika ada langsung return koneksi tersebut (mempercepat proses dari 500ms ke 1ms)

    if (!cached.promise) { // jika belum ada koneksi maka buat koneksi baru namun tidak langsung disimpan ke conn melainkan ke promise
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        }); // sehingga jika ada request koneksi lain sebelum koneksi selesai, request tersebut akan menunggu promise ini selesai
    }

    try { // menunggu promise selesai dan menyimpan hasil koneksi ke conn
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}

export default dbConnect;