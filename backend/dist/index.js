"use strict";
// backend/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Hata yakalama için Node.js process event listener'ları
// Bu satırlar, tüm import'lardan önce gelmelidir.
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Application will terminate:');
    console.error(err.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION! Application will terminate:');
    console.error(reason);
    process.exit(1);
});
// Gerekli kütüphanelerin import edilmesi
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const vision_1 = require("@google-cloud/vision"); // Google Cloud Vision API istemcisi
// Ortam değişkenlerini .env dosyasından yükle
dotenv_1.default.config();
// Google Cloud Vision API istemcisinin tanımlanması
// Global olarak tanımlanır, böylece her istekte yeniden oluşturulmaz
let visionClient;
// Vision API istemcisinin başlatılması
// Bu işlemde bir hata olursa, uygulama hemen sonlandırılır ve hata loglanır
try {
    visionClient = new vision_1.ImageAnnotatorClient();
    console.log('Backend: Google Cloud Vision API Client successfully initialized.');
}
catch (error) {
    console.error('ERROR: Failed to initialize Google Cloud Vision API Client.');
    console.error('Please check GOOGLE_APPLICATION_CREDENTIALS path in your .env file and ensure the JSON key file is valid and in the correct directory.');
    console.error(error); // Hatanın detaylarını yazdır
    process.exit(1); // Uygulamayı bir hata koduyla sonlandır
}
// Express uygulamasının oluşturulması
const app = (0, express_1.default)();
const port = process.env.PORT || 5001; // Port, .env dosyasından okunur, yoksa 5001 varsayılan olur
// CORS middleware'i - Farklı kaynaklardan gelen isteklere izin verir
app.use((0, cors_1.default)());
// JSON body parser - Gelen isteklerdeki JSON verilerini ayrıştırmak için
app.use(express_1.default.json());
// Multer depolama ayarları - Yüklenen dosyaları bellekte tutar
const storage = multer_1.default.memoryStorage();
// --- Dosya boyutu ve tip kontrolü ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('Sadece görsel dosyalarına izin verilir (jpeg, png, webp, gif, bmp).'));
        }
        cb(null, true);
    },
});
// Anasayfa rotası - Sunucunun çalıştığını doğrulamak için
app.get('/', (req, res) => {
    res.send('Image Optimizer Backend is running!');
});
// --- Servis Fonksiyonları ---
async function generateAltText(buffer, originalFileName, visionClient) {
    let generatedAltText = `Optimized image for ${originalFileName}`;
    try {
        const [result] = await visionClient.labelDetection({
            image: { content: buffer.toString('base64') },
        });
        const labels = result.labelAnnotations;
        if (labels && labels.length > 0) {
            const descriptions = labels
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 3)
                .map(label => label.description)
                .filter(Boolean);
            if (descriptions.length > 0) {
                generatedAltText = descriptions.join(', ') + ' image';
            }
        }
        if (!generatedAltText || generatedAltText.includes('Optimized image for')) {
            generatedAltText = `Optimized image for ${originalFileName}`;
        }
    }
    catch (error) {
        console.error('Error generating alt text:', error);
    }
    return generatedAltText;
}
function createWebpFileName(altText) {
    const cleanedAltText = altText
        .toLowerCase()
        .replace(/[^\w\s-çğıöşü]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
    return `${cleanedAltText}.webp`;
}
async function convertToWebp(buffer) {
    return (0, sharp_1.default)(buffer).webp({ quality: 80 }).toBuffer();
}
// Görsel yükleme ve işleme rotası
app.post('/upload', upload.single('image'), (async (req, res, next) => {
    console.log('Backend: Received a new POST request to /upload.');
    if (!req.file) {
        console.warn('Backend: Upload request received but no file found.');
        return res.status(400).json({ error: 'No file uploaded or file type is not supported.' });
    }
    const uploadedFile = req.file;
    console.log(`Backend: Uploaded File Info: ${uploadedFile.originalname}, Size: ${uploadedFile.size} bytes`);
    const originalFileName = path_1.default.parse(uploadedFile.originalname).name;
    try {
        // Alt text generation
        const generatedAltText = await generateAltText(uploadedFile.buffer, originalFileName, visionClient);
        // File name creation
        const newFileName = createWebpFileName(generatedAltText);
        // Convert to WebP
        const processedImageBuffer = await convertToWebp(uploadedFile.buffer);
        const base64Image = processedImageBuffer.toString('base64');
        const downloadUrl = `data:image/webp;base64,${base64Image}`;
        res.json({
            message: 'File processed successfully!',
            originalFileName: uploadedFile.originalname,
            newFileName: newFileName,
            fileSize: processedImageBuffer.byteLength,
            mimeType: 'image/webp',
            altText: generatedAltText,
            downloadUrl: downloadUrl,
        });
    }
    catch (error) {
        console.error('Backend: Error processing image or Vision API (POST /upload):', error);
        next(error);
    }
}));
// Genel hata işleyici middleware
// Bu middleware, next(error) ile yakalanan veya uncaughtException ile fırlatılan hataları yakalar
app.use((err, req, res, next) => {
    console.error('Backend: Unhandled Error in Express Middleware (Global Error Handler):', err.stack);
    let message = err.message || 'An unexpected server error occurred. Please check the logs.';
    if (message.includes('File too large')) {
        message = 'The uploaded file is too large. Maximum allowed size is 5MB.';
    }
    res.status(500).json({ error: message });
});
// Sunucuyu belirtilen portta dinlemeye başla
app.listen(port, () => {
    console.log(`Backend: Server listening on port ${port}`);
});
