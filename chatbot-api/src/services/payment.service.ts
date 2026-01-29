import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import User from '../models/user.model';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
    private stripe: Stripe;

    constructor(@InjectModel('User') private userModel: Model<any>) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51SLlsuFt67PKHuRha0s9vouRfW4awogsZxKR4le8PuflPpbgea5OqKPI3bpqNqA4iHR9cuT5bIa04rHMHT7KgDHo00YtpBtmcY', {
            apiVersion: '2025-12-15.clover',
        } as any);
    }

    // Create Stripe checkout session for credit purchase
    async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: email,
                metadata: { userId: userId },
            });
            customerId = customer.id;
            await this.userModel.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
        }

        // Create checkout session for $3 = 20 credits
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'ChatBot Credits',
                            description: '20 Credits for ChatBot prompts',
                        },
                        unit_amount: 300, // $3.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
            metadata: {
                userId: userId,
                credits: '20',
            },
        });

        return { url: session.url! };
    }

    // Handle Stripe webhook for successful payment
    async handlePaymentSuccess(sessionId: string): Promise<{ credits: number }> {
        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            throw new BadRequestException('Payment not completed');
        }

        const userId = session.metadata?.userId;
        const creditsToAdd = parseInt(session.metadata?.credits || '20', 10);

        if (!userId) {
            throw new BadRequestException('User ID not found in session');
        }

        // Add credits to user
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $inc: { credits: creditsToAdd } },
            { new: true }
        );

        if (!user) {
            throw new BadRequestException('User not found');
        }

        return { credits: user.credits };
    }

    // Get user credits
    async getUserCredits(userId: string): Promise<{ credits: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        return { credits: user.credits || 0 };
    }

    // Deduct credits after message
    async deductCredit(userId: string): Promise<{ credits: number; success: boolean }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.credits <= 0) {
            return { credits: 0, success: false };
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { $inc: { credits: -1 } },
            { new: true }
        );

        return { credits: updatedUser!.credits, success: true };
    }

    // Check if user has credits
    async hasCredits(userId: string): Promise<boolean> {
        const user = await this.userModel.findById(userId);
        return user ? user.credits > 0 : false;
    }

    // Add credits directly (for webhook handling)
    async addCredits(userId: string, amount: number): Promise<{ credits: number }> {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $inc: { credits: amount } },
            { new: true }
        );

        if (!user) {
            throw new BadRequestException('User not found');
        }

        return { credits: user.credits };
    }
}
