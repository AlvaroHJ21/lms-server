import cloudinary from 'cloudinary';

import { app } from '../src/app';
import connectDB from './utils/db';

// cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// create server
app.listen(process.env.PORT, () => {
  console.log(`✅ Server is connected with port ${process.env.PORT}`);
  connectDB();
});
