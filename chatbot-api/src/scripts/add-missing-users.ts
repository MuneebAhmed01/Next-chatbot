import { connectDB } from '../config/database';
import User from '../models/user.model';

async function addMissingUsers() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Add missing users from mock database
    const missingUsers = [
      {
        email: 'credituser@example.com',
        password: '$2b$10$C6dm6QFemIq8fw/pt/GEjOkfAwcT67IEMrL2ZB6huLA7LNPfVuQ0e',
        name: 'Credit User',
        credits: 35,
        createdAt: new Date('2026-01-28T17:40:57.465Z')
      },
      {
        email: 'testfile@example.com',
        password: '$2b$10$LGBv8iRUItsZKrQIeqgaHuF1DohrVU.bZgEc/swMUFQQK8cA7hFKK',
        name: 'Test File',
        credits: 0,
        createdAt: new Date('2026-01-28T17:28:11.619Z')
      }
    ];

    for (const userData of missingUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const newUser = new User(userData);
          await newUser.save();
          console.log(`✅ Added user: ${userData.email} (credits: ${userData.credits})`);
        } else {
          console.log(`⏭️  User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to add ${userData.email}:`, error);
      }
    }
    
    // Check final state
    const users = await User.find({});
    console.log('\nAll users in MongoDB:');
    users.forEach(user => {
      console.log(`- ${user.email} (credits: ${user.credits || 0})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingUsers();
