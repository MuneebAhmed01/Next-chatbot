import { connectDB } from '../config/database';
import User from '../models/user.model';

async function checkUsers() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users in MongoDB:`);
    users.forEach(user => {
      console.log(`- ${user.email} (credits: ${user.credits || 0})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
