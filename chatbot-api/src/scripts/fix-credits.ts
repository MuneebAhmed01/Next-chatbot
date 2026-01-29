import { connectDB } from '../config/database';
import User from '../models/user.model';

async function fixCredits() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Update specific users with their correct credits
    const usersToUpdate = [
      { email: 'alaadinpubg2@gmail.com', credits: 25 },
      { email: 'credituser@example.com', credits: 35 },
      { email: 'testfile@example.com', credits: 0 }
    ];

    for (const userUpdate of usersToUpdate) {
      try {
        const user = await User.findOne({ email: userUpdate.email });
        if (user) {
          await User.findByIdAndUpdate(user._id, { credits: userUpdate.credits });
          console.log(`✅ Updated credits for ${userUpdate.email}: ${user.credits} → ${userUpdate.credits}`);
        } else {
          console.log(`❌ User not found: ${userUpdate.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${userUpdate.email}:`, error);
      }
    }
    
    // Check final state
    const users = await User.find({});
    console.log('\nFinal user credits:');
    users.forEach(user => {
      console.log(`- ${user.email} (credits: ${user.credits || 0})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCredits();
