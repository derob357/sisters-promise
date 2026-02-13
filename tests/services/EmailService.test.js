/**
 * EmailService Tests
 */
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const nodemailer = require('nodemailer');
const fs = require('fs');

// Set env before requiring service
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.SMTP_HOST = 'smtp.test.com';

const EmailService = require('../../services/EmailService');

describe('EmailService', () => {
  let emailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new EmailService();
  });

  describe('constructor', () => {
    it('should initialize with SMTP transporter when credentials exist', () => {
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(emailService.transporter).toBeDefined();
    });
  });

  describe('loadTemplate', () => {
    it('should return null if template file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const result = emailService.loadTemplate('nonexistent');
      expect(result).toBeNull();
    });

    it('should load and replace template variables', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('<h1>Hello {{ name }}</h1>');

      const result = emailService.loadTemplate('welcome', { name: 'John' });
      expect(result).toBe('<h1>Hello John</h1>');
    });

    it('should handle multiple variables', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{{ greeting }} {{ name }}!');

      const result = emailService.loadTemplate('test', { greeting: 'Hi', name: 'Jane' });
      expect(result).toBe('Hi Jane!');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should return false if transporter is null', async () => {
      emailService.transporter = null;
      const result = await emailService.sendWelcomeEmail({ email: 'test@test.com' });
      expect(result).toBe(false);
    });

    it('should send welcome email successfully', async () => {
      fs.existsSync.mockReturnValue(false); // Will use fallback text
      const result = await emailService.sendWelcomeEmail({
        email: 'new@test.com',
        firstName: 'Jane',
        unsubscribeToken: 'token-123',
      });

      expect(result).toBe(true);
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@test.com',
          subject: "Welcome to Sister's Promise!",
        })
      );
    });
  });

  describe('sendNewsletter', () => {
    it('should return zero counts if transporter is null', async () => {
      emailService.transporter = null;
      const result = await emailService.sendNewsletter({}, []);
      expect(result).toEqual({ success: 0, failed: 0 });
    });

    it('should return failed count if template not found', async () => {
      fs.existsSync.mockReturnValue(false);
      const subscribers = [{ email: 'a@test.com' }, { email: 'b@test.com' }];
      const result = await emailService.sendNewsletter({ templateId: 'missing' }, subscribers);
      expect(result).toEqual({ success: 0, failed: 2 });
    });

    it('should send to all subscribers', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('<p>Hello {{firstName}}</p>');

      const subscribers = [
        { email: 'a@test.com', firstName: 'Alice', unsubscribeToken: 'tok-a' },
        { email: 'b@test.com', firstName: 'Bob', unsubscribeToken: 'tok-b' },
      ];

      const result = await emailService.sendNewsletter(
        { id: 'camp-1', subject: 'Newsletter', templateId: 'newsletter' },
        subscribers
      );

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(emailService.transporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendOrderConfirmation (named params version)', () => {
    it('should skip if transporter is null', async () => {
      emailService.transporter = null;
      await emailService.sendOrderConfirmation({
        customerName: 'Test',
        customerEmail: 'test@test.com',
        orderId: '12345678-abcd',
        products: [],
        total: 25.00,
        shippingAddress: { street: '123 Main', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
      });
      // Should not throw
    });

    it('should handle invalid products array gracefully', async () => {
      await emailService.sendOrderConfirmation({
        customerName: 'Test',
        customerEmail: 'test@test.com',
        orderId: '12345678-abcd',
        products: 'not-an-array',
        total: 25.00,
        shippingAddress: { street: '123 Main', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
      });

      expect(emailService.transporter.sendMail).toHaveBeenCalled();
    });

    it('should send order confirmation email', async () => {
      await emailService.sendOrderConfirmation({
        customerName: 'Jane',
        customerEmail: 'jane@test.com',
        orderId: '12345678-abcd',
        products: [{ name: 'Soap', quantity: 2, price: 12.50 }],
        total: 25.00,
        shippingAddress: { street: '123 Main', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
      });

      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@test.com',
          subject: expect.stringContaining('Order Confirmation'),
        })
      );
    });
  });

  describe('verify', () => {
    it('should return false if transporter is null', async () => {
      emailService.transporter = null;
      const result = await emailService.verify();
      expect(result).toBe(false);
    });

    it('should return true on successful verification', async () => {
      const result = await emailService.verify();
      expect(result).toBe(true);
    });
  });
});
