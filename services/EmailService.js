/**
 * Email Service
 * Handles email sending via Nodemailer or SendGrid
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = this.initializeTransporter();
    this.templatesDir = path.join(__dirname, '../templates/emails');
  }

  /**
   * Initialize email transporter based on environment
   */
  initializeTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'sendgrid') {
      return this.setupSendGrid();
    } else {
      return this.setupSMTP();
    }
  }

  /**
   * Setup SMTP transporter (Gmail, custom SMTP, etc.)
   */
  setupSMTP() {
    try {
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };

      if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️  SMTP credentials not configured. Email sending disabled.');
        return null;
      }

      const transporter = nodemailer.createTransport(config);
      console.log('✓ SMTP transporter initialized');
      return transporter;
    } catch (error) {
      console.error('Error initializing SMTP:', error.message);
      return null;
    }
  }

  /**
   * Setup SendGrid transporter
   */
  setupSendGrid() {
    try {
      const sgTransport = require('nodemailer-sendgrid-transport');
      
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️  SendGrid API key not configured. Email sending disabled.');
        return null;
      }

      const transporter = nodemailer.createTransport(
        sgTransport({
          apiKey: process.env.SENDGRID_API_KEY,
        })
      );

      console.log('✓ SendGrid transporter initialized');
      return transporter;
    } catch (error) {
      console.error('Error initializing SendGrid:', error.message);
      return null;
    }
  }

  /**
   * Load and render email template
   */
  loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        console.warn(`Template not found: ${templateName}`);
        return null;
      }

      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, variables[key]);
      });

      return html;
    } catch (error) {
      console.error('Error loading template:', error.message);
      return null;
    }
  }

  /**
   * Send welcome email to new subscriber
   */
  async sendWelcomeEmail(subscriber) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const html = this.loadTemplate('welcome', {
        firstName: subscriber.firstName || 'Friend',
        unsubscribeLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`,
      });

      const mailOptions = {
        from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
        to: subscriber.email,
        subject: 'Welcome to Sisters Promise!',
        html: html || `Welcome to Sisters Promise, ${subscriber.firstName}!`,
        text: `Welcome to Sisters Promise, ${subscriber.firstName}! Thank you for subscribing.`,
        replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error.message);
      return false;
    }
  }

  /**
   * Send newsletter to subscribers
   */
  async sendNewsletter(campaign, subscribers, templateVariables = {}) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    const html = this.loadTemplate(campaign.templateId, templateVariables);
    if (!html) {
      console.error('Template not found for campaign:', campaign.id);
      return { success: 0, failed: subscribers.length };
    }

    for (const subscriber of subscribers) {
      try {
        const mailOptions = {
          from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
          to: subscriber.email,
          subject: campaign.subject,
          html: html
            .replace(/{{firstName}}/g, subscriber.firstName || 'Friend')
            .replace(/{{email}}/g, subscriber.email)
            .replace(/{{unsubscribeLink}}/g, `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`)
            .replace(/{{campaignId}}/g, campaign.id)
            .replace(/{{subscriberId}}/g, subscriber.id),
          replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
        };

        await this.transporter.sendMail(mailOptions);
        successCount++;
        console.log(`Newsletter sent to ${subscriber.email}`);
      } catch (error) {
        failedCount++;
        console.error(`Failed to send newsletter to ${subscriber.email}:`, error.message);
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Send promotional email
   */
  async sendPromotion(subscriber, promotion) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const html = this.loadTemplate('promotion', {
        firstName: subscriber.firstName || 'Friend',
        promotionTitle: promotion.title,
        promotionDescription: promotion.description,
        promotionCode: promotion.code,
        promotionLink: promotion.link || `${process.env.APP_URL || 'http://localhost:3000'}/pages/shop`,
        unsubscribeLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`,
      });

      const mailOptions = {
        from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
        to: subscriber.email,
        subject: `${promotion.title} - Sisters Promise`,
        html: html || `Check out this promotion: ${promotion.title}`,
        text: `${promotion.title}: ${promotion.description}`,
        replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Promotional email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending promotional email:', error.message);
      return false;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(subscriber, order) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const orderItemsHtml = order.items
        .map(item => `<li>${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`)
        .join('');

      const html = this.loadTemplate('order-confirmation', {
        firstName: subscriber.firstName || 'Friend',
        orderId: order.id,
        orderDate: new Date(order.date).toLocaleDateString(),
        orderItems: orderItemsHtml,
        orderTotal: `$${order.total.toFixed(2)}`,
        trackingUrl: order.trackingUrl || `${process.env.APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
        unsubscribeLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`,
      });

      const mailOptions = {
        from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
        to: subscriber.email,
        subject: `Order Confirmation #${order.id}`,
        html: html || `Your order #${order.id} has been confirmed!`,
        text: `Thank you for your order! Order ID: ${order.id}. Total: $${order.total.toFixed(2)}`,
        replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error.message);
      return false;
    }
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(subscriber, cartItems) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const cartItemsHtml = cartItems
        .map(item => `<li>${item.name} - $${item.price.toFixed(2)}</li>`)
        .join('');

      const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);

      const html = this.loadTemplate('abandoned-cart', {
        firstName: subscriber.firstName || 'Friend',
        cartItems: cartItemsHtml,
        cartTotal: `$${cartTotal}`,
        checkoutUrl: `${process.env.APP_URL || 'http://localhost:3000'}/pages/shop`,
        unsubscribeLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`,
      });

      const mailOptions = {
        from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
        to: subscriber.email,
        subject: 'You left items in your cart! - Sisters Promise',
        html: html || `You have items in your cart worth $${cartTotal}!`,
        text: `Complete your purchase! Items in cart: $${cartTotal}`,
        replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Abandoned cart email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending abandoned cart email:', error.message);
      return false;
    }
  }

  /**
   * Send custom email to specific subscriber
   */
  async sendCustomEmail(subscriber, emailConfig) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const html = this.loadTemplate(emailConfig.template, emailConfig.variables || {});

      const mailOptions = {
        from: `"Sisters Promise" <${process.env.SMTP_FROM || 'info@sisterspromise.com'}>`,
        to: subscriber.email,
        subject: emailConfig.subject,
        html: html || emailConfig.fallbackText,
        text: emailConfig.fallbackText,
        replyTo: process.env.REPLY_TO_EMAIL || 'info@sisterspromise.com',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Custom email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending custom email:', error.message);
      return false;
    }
  }

  /**
   * Send bulk email to multiple subscribers
   */
  async sendBulkEmail(subscribers, emailConfig) {
    if (!this.transporter) {
      console.warn('Email service not configured');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const emailData = {
          ...emailConfig,
          variables: {
            ...emailConfig.variables,
            firstName: subscriber.firstName || 'Friend',
            email: subscriber.email,
            unsubscribeLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/email/unsubscribe/${subscriber.unsubscribeToken}`,
          },
        };

        const success = await this.sendCustomEmail(subscriber, emailData);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        console.error(`Bulk email failed for ${subscriber.email}:`, error.message);
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Verify email transporter connection
   */
  async verify() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✓ Email transporter verified');
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error.message);
      return false;
    }
  }

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation({ customerName, customerEmail, orderId, products, total, shippingAddress }) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping order confirmation.');
      return;
    }

    try {
      const productsList = products.map(p => 
        `<tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.price.toFixed(2)}</td><td>$${(p.quantity * p.price).toFixed(2)}</td></tr>`
      ).join('');

      const htmlContent = `
        <h2>Order Confirmation</h2>
        <p>Thank you for your order, ${customerName}!</p>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <table border="1" cellpadding="8" style="margin: 20px 0;">
          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          ${productsList}
        </table>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Shipping Address:</strong><br>
        ${shippingAddress.street}<br>
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
        ${shippingAddress.country}</p>
        <p>We'll notify you when your order ships!</p>
        <p>Questions? Contact us at denise@sisterspromise.com</p>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'denise@sisterspromise.com',
        to: customerEmail,
        subject: `Order Confirmation - Sisters Promise #${orderId.slice(0, 8)}`,
        html: htmlContent,
      });

      console.log(`✓ Order confirmation sent to ${customerEmail}`);
    } catch (error) {
      console.error('Error sending order confirmation:', error.message);
    }
  }

  /**
   * Send order notification to admin/owner
   */
  async sendOrderNotification({ orderId, customerName, customerEmail, total, paymentMethod, paymentStatus, createdBy }) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping admin notification.');
      return;
    }

    try {
      const htmlContent = `
        <h2>New Manual Order Created</h2>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
        <p><strong>Payment Status:</strong> ${paymentStatus.toUpperCase()}</p>
        <p><strong>Created by:</strong> ${createdBy}</p>
        <p><a href="${process.env.APP_URL || 'https://localhost'}/admin-order-dashboard.html">View Order</a></p>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'denise@sisterspromise.com',
        to: process.env.ADMIN_EMAIL || 'denise@sisterspromise.com',
        subject: `New Manual Order - #${orderId.slice(0, 8)}`,
        html: htmlContent,
      });

      console.log(`✓ Order notification sent to admin`);
    } catch (error) {
      console.error('Error sending order notification:', error.message);
    }
  }

  /**
   * Send payment status update to customer
   */
  async sendPaymentStatusUpdate({ customerName, customerEmail, orderId, paymentStatus, total }) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping payment update.');
      return;
    }

    try {
      const statusMessages = {
        pending: 'Your payment is pending processing',
        completed: 'Your payment has been successfully processed',
        processing: 'Your payment is being processed',
        failed: 'Your payment failed. Please contact us.',
        refunded: 'Your payment has been refunded',
      };

      const htmlContent = `
        <h2>Payment Status Update</h2>
        <p>Hi ${customerName},</p>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p>${statusMessages[paymentStatus] || 'Your payment status has been updated'}</p>
        <p><strong>Order Total:</strong> $${total.toFixed(2)}</p>
        <p>Thank you for your business!</p>
        <p>Questions? Contact us at denise@sisterspromise.com</p>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'denise@sisterspromise.com',
        to: customerEmail,
        subject: `Payment Status Update - Sisters Promise #${orderId.slice(0, 8)}`,
        html: htmlContent,
      });

      console.log(`✓ Payment status update sent to ${customerEmail}`);
    } catch (error) {
      console.error('Error sending payment status update:', error.message);
    }
  }

  /**
   * Send order status update to customer
   */
  async sendOrderStatusUpdate({ customerName, customerEmail, orderId, orderStatus }) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping order status update.');
      return;
    }

    try {
      const statusMessages = {
        confirmed: 'Your order has been confirmed and is being prepared',
        processing: 'Your order is being processed',
        shipped: 'Your order has shipped!',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled',
      };

      const htmlContent = `
        <h2>Order Status Update</h2>
        <p>Hi ${customerName},</p>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}</p>
        <p>${statusMessages[orderStatus] || 'Your order status has been updated'}</p>
        <p>Thank you for choosing Sisters Promise!</p>
        <p>Questions? Contact us at denise@sisterspromise.com</p>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'denise@sisterspromise.com',
        to: customerEmail,
        subject: `Order Status Update - Sisters Promise #${orderId.slice(0, 8)}`,
        html: htmlContent,
      });

      console.log(`✓ Order status update sent to ${customerEmail}`);
    } catch (error) {
      console.error('Error sending order status update:', error.message);
    }
  }
}

module.exports = EmailService;
