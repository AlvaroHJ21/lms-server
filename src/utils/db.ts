import mongoose from 'mongoose';

const dbUrl: string = process.env.DB_URL || '';

const connectDB = async () => {
  try {
    // console.log('Connecting to database...');
    const data = await mongoose.connect(dbUrl);
    console.log(`✅ Database connected with ${data.connection.host}`);
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
