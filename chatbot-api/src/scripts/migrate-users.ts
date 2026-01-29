import { connectDB } from '../config/database';
import User from '../models/user.model';
import fs from 'fs';
import path from 'path';

// Define mock user interface
interface MockUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  credits?: number;
  createdAt: string;
}

// Read mock users from frontend file
const mockUsersPath = path.join(__dirname, '../../../../chatbot/.mock-users.json');

async function migrateUsers() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Read mock users
    let mockUsers: MockUser[] = [];
    if (fs.existsSync(mockUsersPath)) {
      const data = fs.readFileSync(mockUsersPath, 'utf-8');
      mockUsers = JSON.parse(data);
      console.log(`Found ${mockUsers.length} users in mock database`);
    }

    // Migrate each user
    for (const mockUser of mockUsers) {
      try {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email: mockUser.email });
        
        if (!existingUser) {
          // Create user in MongoDB
          const newUser = new User({
            email: mockUser.email,
            password: mockUser.password,
            name: mockUser.name,
            credits: mockUser.credits || 0,
            createdAt: new Date(mockUser.createdAt)
          });

          await newUser.save();
          console.log(`✅ Migrated user: ${mockUser.email} (credits: ${mockUser.credits || 0})`);
        } else {
          // Update credits if different
          const mockCredits = mockUser.credits || 0;
          if (existingUser.credits !== mockCredits) {
            await User.findByIdAndUpdate(existingUser._id, { credits: mockCredits });
            console.log(`🔄 Updated credits for ${mockUser.email}: ${existingUser.credits} → ${mockCredits}`);
          } else {
            console.log(`⏭️  User already exists with correct credits: ${mockUser.email}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to migrate user ${mockUser.email}:`, error);
      }
    }

    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
