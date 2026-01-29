import { Controller, Get, Post, Body, Param, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    
    @Post('create-checkout-session')
    async createCheckoutSession(
        @Body() body: { userId: string; email: string }
    ): Promise<{ url: string }> {
        return this.paymentService.createCheckoutSession(body.userId, body.email);
    }

    @Post('confirm')
    async confirmPayment(
        @Body() body: { sessionId: string }
    ): Promise<{ credits: number }> {
        return this.paymentService.handlePaymentSuccess(body.sessionId);
    }

   
    @Get('credits/:userId')
    async getUserCredits(
        @Param('userId') userId: string
    ): Promise<{ credits: number }> {
        return this.paymentService.getUserCredits(userId);
    }

   
    @Post('deduct')
    async deductCredit(
        @Body() body: { userId: string }
    ): Promise<{ credits: number; success: boolean }> {
        return this.paymentService.deductCredit(body.userId);
    }

    @Get('has-credits/:userId')
    async hasCredits(
        @Param('userId') userId: string
    ): Promise<{ hasCredits: boolean }> {
        const hasCredits = await this.paymentService.hasCredits(userId);
        return { hasCredits };
    }

    @Post('add-credits')
    async addCredits(
        @Body() body: { userId: string; amount: number }
    ): Promise<{ credits: number }> {
        return this.paymentService.addCredits(body.userId, body.amount);
    }
}