import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import Stripe from 'stripe';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private stripe: Stripe;

    constructor(@InjectModel('User') private userModel: Model<any>) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        
        if (!stripeKey) {
            this.logger.error('STRIPE_SECRET_KEY not configured in environment variables');
            throw new Error('Stripe configuration missing');
        }

        if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
            this.logger.error('Invalid Stripe secret key format');
            throw new Error('Invalid Stripe configuration');
        }

        try {
            this.stripe = new Stripe(stripeKey, {
                apiVersion: '2025-12-15.clover',
            });
            this.logger.log('Stripe initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Stripe:', error.message);
            throw new Error('Stripe initialization failed');
        }
    }

    async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
        try {
            this.logger.log(`Creating checkout session for user: ${userId}`);
            
            const user = await this.userModel.findById(userId);
            if (!user) {
                this.logger.error(`User not found: ${userId}`);
                throw new BadRequestException('User not found');
            }

            let customerId = user.stripeCustomerId;
            if (!customerId) {
                this.logger.log(`Creating Stripe customer for user: ${userId}`);
                try {
                    const customer = await this.stripe.customers.create({
                        email: email,
                        metadata: { userId: userId },
                    });
                    customerId = customer.id;
                    await this.userModel.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
                    this.logger.log(`Created Stripe customer: ${customerId}`);
                } catch (error) {
                    this.logger.error(`Failed to create Stripe customer: ${error.message}`);
                    throw new BadRequestException('Failed to create payment customer');
                }
            }

            this.logger.log(`Creating checkout session for customer: ${customerId}`);
            
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
                            unit_amount: 300, // $3.00 for 20 credits
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

            this.logger.log(`Checkout session created: ${session.id}`);
            return { url: session.url! };
            
        } catch (error) {
            this.logger.error(`Failed to create checkout session: ${error.message}`);
            
            if (error.type === 'StripeCardError') {
                throw new BadRequestException('Payment processing error: ' + error.message);
            } else if (error.type === 'StripeRateLimitError') {
                throw new BadRequestException('Payment service temporarily unavailable. Please try again.');
            } else if (error.type === 'StripeInvalidRequestError') {
                throw new BadRequestException('Invalid payment request. Please try again.');
            } else if (error.type === 'StripeAPIError') {
                throw new BadRequestException('Payment service error. Please try again later.');
            } else if (error.type === 'StripeConnectionError') {
                throw new BadRequestException('Unable to connect to payment service. Please check your connection.');
            } else if (error.type === 'StripeAuthenticationError') {
                throw new BadRequestException('Payment authentication failed. Please check configuration.');
            } else {
                throw new BadRequestException('Failed to start checkout. Please try again.');
            }
        }
    }

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

    async getUserCredits(userId: string): Promise<{ credits: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        return { credits: user.credits || 0 };
    }


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

    async hasCredits(userId: string): Promise<boolean> {
        const user = await this.userModel.findById(userId);
        return user ? user.credits > 0 : false;
    }

   
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
