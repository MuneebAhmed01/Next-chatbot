import fs from 'fs';
import path from 'path';

// In-memory mock database for testing when MongoDB is not configured
interface MockUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  credits: number;
  createdAt: Date;
}

// Use a file to persist mock users across serverless function invocations
const MOCK_USERS_FILE = path.join(process.cwd(), '.mock-users.json');

function readMockUsers(): MockUser[] {
  try {
    if (fs.existsSync(MOCK_USERS_FILE)) {
      const data = fs.readFileSync(MOCK_USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading mock users file:', error);
  }
  return [];
}

function writeMockUsers(users: MockUser[]): void {
  try {
    fs.writeFileSync(MOCK_USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing mock users file:', error);
  }
}

export class MockUserModel {
  static async findOne(query: { email: string }): Promise<MockUser | null> {
    const users = readMockUsers();
    return users.find(user => user.email === query.email) || null;
  }

  static async create(userData: { email: string; password: string; name: string }): Promise<MockUser> {
    const newUser: MockUser = {
      _id: Math.random().toString(36).substring(7),
      email: userData.email,
      password: userData.password,
      name: userData.name,
      credits: 0,
      createdAt: new Date()
    };
    
    const users = readMockUsers();
    users.push(newUser);
    writeMockUsers(users);
    
    return newUser;
  }

  static async find(): Promise<MockUser[]> {
    return readMockUsers();
  }

  static async addCredits(userId: string, amount: number): Promise<MockUser | null> {
    const users = readMockUsers();
    const userIndex = users.findIndex(user => user._id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    // Initialize credits if undefined
    if (!users[userIndex].credits) {
      users[userIndex].credits = 0;
    }
    
    users[userIndex].credits += amount;
    writeMockUsers(users);
    
    return users[userIndex];
  }

  static async findById(userId: string): Promise<MockUser | null> {
    const users = readMockUsers();
    return users.find(user => user._id === userId) || null;
  }
}

export const mockConnect = async () => {
  console.log('Using mock database (file-based storage)');
};
