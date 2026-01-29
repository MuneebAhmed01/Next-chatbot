import { connectDB } from '../config/database';
import User from '../models/user.model';
import * as bcrypt from 'bcrypt';

async function resetPassword() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Reset password for alaadinpubg2@gmail.com to "test123"
    const email = 'alaadinpubg2@gmail.com';
    const newPassword = 'test123';
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ Password reset for ${email}`);
      console.log(`You can now login with password: ${newPassword}`);
    } else {
      console.log(`❌ User not found: ${email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
