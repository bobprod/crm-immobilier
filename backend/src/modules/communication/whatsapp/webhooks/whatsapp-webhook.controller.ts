import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { WhatsAppService } from '../whatsapp.service';
import { MetaWebhookDto } from '../dto/webhook.dto';

@ApiTags('WhatsApp Webhooks')
@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * Meta Cloud API Webhook Verification
   * GET /whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
   */
  @Get()
  @ApiOperation({ summary: 'Webhook verification (Meta)' })
  @HttpCode(HttpStatus.OK)
  verifyWebhook(@Query() query: any): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    this.logger.debug(`Webhook verification: mode=${mode}, token=${token}`);

    // Verify token (should match your webhook secret)
    const expectedToken = process.env.WHATSAPP_META_WEBHOOK_TOKEN || 'your_verify_token';

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    throw new BadRequestException('Verification failed');
  }

  /**
   * Meta Cloud API Webhook - Receive Messages
   * POST /whatsapp/webhook
   */
  @Post()
  @ApiOperation({ summary: 'Receive inbound messages (Meta)' })
  @ApiExcludeEndpoint() // Hide from Swagger (webhook endpoint)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: MetaWebhookDto,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.debug(`Webhook received: ${JSON.stringify(body)}`);

    // TODO: Verify signature for security
    // const verified = this.verifySignature(JSON.stringify(body), signature);
    // if (!verified) {
    //   throw new BadRequestException('Invalid signature');
    // }

    try {
      // Process webhook asynchronously
      setImmediate(() => {
        this.processWebhook(body).catch(error => {
          this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
        });
      });

      // Return 200 OK immediately
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`, error.stack);
      // Still return 200 to avoid retries
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Twilio Webhook - Receive Messages
   * POST /whatsapp/webhook/twilio
   */
  @Post('twilio')
  @ApiOperation({ summary: 'Receive inbound messages (Twilio)' })
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async handleTwilioWebhook(
    @Body() body: any,
    @Headers('x-twilio-signature') signature: string,
  ) {
    this.logger.debug(`Twilio webhook received: ${JSON.stringify(body)}`);

    // TODO: Verify Twilio signature
    // const verified = this.twilioProvider.verifyWebhookSignature(...);

    try {
      // Process Twilio webhook
      // Convert to standard format and process
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Twilio webhook error: ${error.message}`, error.stack);
      return { status: 'error' };
    }
  }

  /**
   * Process webhook in background
   */
  private async processWebhook(webhook: MetaWebhookDto) {
    if (webhook.object !== 'whatsapp_business_account') {
      this.logger.debug(`Ignoring webhook object: ${webhook.object}`);
      return;
    }

    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Determine config ID from phone number or business account
        // For now, we'll need to lookup config by phone number ID
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) {
          this.logger.warn('No phone number ID in webhook');
          continue;
        }

        // Find config by phone number ID
        // This is a simplified version - in production, add proper lookup
        const configId = await this.findConfigByPhoneNumberId(phoneNumberId);

        if (!configId) {
          this.logger.warn(`Config not found for phone number: ${phoneNumberId}`);
          continue;
        }

        // Process messages
        await this.whatsappService.handleInboundMessage(configId, webhook);
      }
    }
  }

  /**
   * Find config by Meta phone number ID
   */
  private async findConfigByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    // TODO: Implement proper lookup
    // For now, return null (will need to query Prisma)
    this.logger.debug(`Looking up config for phone number ID: ${phoneNumberId}`);
    return null;
  }

  /**
   * Verify webhook signature (Meta)
   */
  private verifySignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.WHATSAPP_META_APP_SECRET || '';

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}
