import 'dotenv/config';
import createApp from './app.js';
import connectDB from './config/db.js';
import { seedFallback } from './services/movieService.js';

for (const k of ['MONGODB_URI', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing ${k} in .env`); process.exit(1); }
await connectDB();
await seedFallback();
const port = process.env.PORT || 5000;
createApp().listen(port, () => console.log(`API running on http://localhost:${port}`));
