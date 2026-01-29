import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../services/user.service';
import mongoose from 'mongoose';

async function testAuthFlow() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userService = app.get(UserService);

    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User';

    console.log(`\nStarting Auth Flow Test for: ${testEmail}`);

    try {
        // 1. Signup (Get OTP)
        console.log('\n1. Initiating Signup...');
        const signupResult = await userService.initiateSignup(testName, testEmail, testPassword);
        console.log('Signup Result:', signupResult);

        if (!signupResult.otp) {
            throw new Error('No OTP returned from signup (is it being sent via email only?)');
        }

        const otp = signupResult.otp;
        console.log(`OTP Received: ${otp}`);

        // 2. Verify OTP
        console.log('\n2. Verifying OTP...');
        const verifyResult = await userService.verifyOTPAndSignup(testEmail, otp);
        console.log('Verification Result:', verifyResult);

        // 3. Login
        console.log('\n3. Logging in...');
        const loginResult = await userService.login(testEmail, testPassword);
        console.log('Login Result:', loginResult);

        console.log('\nSUCCESS: Auth flow completed successfully!');

    } catch (error) {
        console.error('\nERROR in Auth Flow:', error);
    } finally {
        await app.close();
        // Force close mongoose connection to exit script
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}

testAuthFlow();
