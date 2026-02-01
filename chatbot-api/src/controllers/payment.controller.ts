import { Controller, Get, Post, Body, Param, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import type {
  CreateCheckoutSessionDto,
  ConfirmPaymentDto,
  DeductCreditDto,
  AddCreditsDto,
} from '../zod-schemas/payment.schema';
import {
  createCheckoutSessionSchema,
  confirmPaymentSchema,
  deductCreditSchema,
  addCreditsSchema,
} from '../zod-schemas/payment.schema';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    
    @Post('create-checkout-session')
    async createCheckoutSession(
        @Body(new ZodValidationPipe(createCheckoutSessionSchema)) body: CreateCheckoutSessionDto
    ): Promise<{ url: string }> {
        return this.paymentService.createCheckoutSession(body.userId, body.email);
    }

    @Post('confirm')
    async confirmPayment(
        @Body(new ZodValidationPipe(confirmPaymentSchema)) body: ConfirmPaymentDto
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
        @Body(new ZodValidationPipe(deductCreditSchema)) body: DeductCreditDto
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
        @Body(new ZodValidationPipe(addCreditsSchema)) body: AddCreditsDto
    ): Promise<{ credits: number }> {
        return this.paymentService.addCredits(body.userId, body.amount);
    }
}