# Admin Order Management System - Setup Guide

Sisters Promise Manual Order Entry & Payment Processing for Owner/Admin

---

## Overview

The Admin Order Management System allows **Owner** and **Admin** users to:
- ✅ Manually create orders for customers (phone orders, in-person sales, etc.)
- ✅ Add multiple products with quantities and prices
- ✅ Calculate subtotal, shipping, and tax automatically
- ✅ Record different payment methods (cash, card, check, Venmo, PayPal)
- ✅ Process payments and update payment status
- ✅ Track order fulfillment status (confirmed → processing → shipped → delivered)
- ✅ Send automated confirmation and status emails to customers
- ✅ View all manual orders in a clean dashboard

---

## Access the Dashboard

### URL
```
https://sisterspromise.com/admin-order-dashboard.html
```

### Default Admin Users
1. **Owner**: Denise Robinson
   - Email: `denise@sisterspromise.com`
   - Password: Set via `OWNER_PASSWORD` environment variable

2. **Admin**: Deric Robinson
   - Email: `deric.robinson71@gmail.com`
   - Password: Set via `ADMIN_PASSWORD` environment variable

### Login Process
1. Navigate to the dashboard URL
2. Enter email and password
3. Click "Login"
4. Access is granted automatically for owner/admin roles

---

## Creating a Manual Order

### Step 1: Customer Information
Fill in the customer details:
- **Customer Name** (required)
- **Customer Email** (required)
- **Phone Number** (optional)
- **Order Date** (defaults to today)

### Step 2: Shipping Address
Enter complete shipping address:
- **Street Address** (required)
- **City** (required)
- **State** (required)
- **ZIP Code** (required)
- **Country** (defaults to USA)

### Step 3: Add Products
1. Enter product name (e.g., "Sea Moss Soap")
2. Quantity (minimum 1)
3. Price per unit
4. Click "Add Product" to add more items
5. Prices calculate automatically

**Product Examples:**
- Sea Moss Soap - $12.99
- Body Lotion - $18.99
- Skin Scrub - $15.99
- Lip Balm - $8.99

### Step 4: Costs & Totals
The dashboard automatically calculates:
- **Subtotal**: Sum of all products
- **Shipping**: Enter shipping cost (optional)
- **Tax**: Enter tax amount (optional)
- **Total**: Automatically calculated

### Step 5: Payment Information
1. Select payment method:
   - **Cash** (Paid in person) - marks as pending
   - **Credit/Debit Card** - marks as processing
   - **Check** - marks as processing
   - **Venmo** - marks as processing
   - **PayPal** - marks as processing
   - **Other** - marks as processing

2. If payment method is not "Cash", add payment reference:
   - Last 4 digits of card
   - Check number
   - Transaction ID
   - Venmo username
   - PayPal email

### Step 6: Submit Order
1. Click **"Create & Process Order"**
2. Order is automatically created in database
3. Confirmation email sent to customer
4. Notification email sent to admin/owner
5. Order appears in "Recent Manual Orders" table

---

## Order Management

### Viewing Orders
Orders appear in the "Recent Manual Orders" table with:
- Order ID (first 8 characters)
- Customer name
- Total amount
- Payment status badge
- Order date
- View button

### Updating Order Status

Use the API endpoints to update status (can be integrated into dashboard later):

**Update Payment Status:**
```bash
curl -X PUT https://sisterspromise.com/api/admin/orders/{orderId}/payment-status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "paymentStatus": "completed",
    "paymentReference": "CHK-12345"
  }
```

**Update Order Status:**
```bash
curl -X PUT https://sisterspromise.com/api/admin/orders/{orderId}/order-status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "orderStatus": "shipped"
  }
```

---

## API Endpoints

### Create Manual Order
```
POST /api/admin/orders/manual
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "(555) 123-4567",
  "orderDate": "2026-01-15",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "USA"
  },
  "products": [
    {
      "name": "Sea Moss Soap",
      "quantity": 2,
      "price": 12.99
    },
    {
      "name": "Body Lotion",
      "quantity": 1,
      "price": 18.99
    }
  ],
  "paymentMethod": "card",
  "paymentReference": "Last 4: 4242",
  "subtotal": 44.97,
  "shipping": 5.00,
  "tax": 3.87,
  "total": 53.84,
  "notes": "Gift wrapping requested"
}

Response:
{
  "success": true,
  "message": "Manual order created successfully",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customerName": "John Doe",
    "total": 53.84,
    "paymentStatus": "processing",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### List Manual Orders
```
GET /api/admin/orders/manual?limit=20&skip=0
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "total": 53.84,
      "paymentStatus": "processing",
      "orderStatus": "confirmed",
      "createdAt": "2026-01-15T10:30:00Z",
      "products": [...]
    }
  ],
  "count": 1,
  "limit": 20,
  "skip": 0
}
```

### Get Specific Order
```
GET /api/admin/orders/{orderId}
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "(555) 123-4567",
    "shippingAddress": {...},
    "products": [...],
    "paymentMethod": "card",
    "paymentStatus": "processing",
    "orderStatus": "confirmed",
    "total": 53.84,
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### Update Payment Status
```
PUT /api/admin/orders/{orderId}/payment-status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "paymentStatus": "completed",
  "paymentReference": "TXN-12345"
}

Valid statuses: pending, processing, completed, failed, refunded
```

### Update Order Status
```
PUT /api/admin/orders/{orderId}/order-status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "orderStatus": "shipped"
}

Valid statuses: confirmed, processing, shipped, delivered, cancelled
```

---

## Email Notifications

### Customer Receives
1. **Order Confirmation Email**
   - Order ID
   - All products and prices
   - Total amount
   - Shipping address
   - Sent immediately when order created

2. **Payment Status Update Email**
   - Payment status (completed, failed, etc.)
   - Order ID
   - Total amount

3. **Order Status Update Email**
   - Order status (processing, shipped, delivered, etc.)
   - Tracking information (when available)

### Admin/Owner Receives
1. **New Order Notification**
   - Order ID
   - Customer information
   - Total amount
   - Payment method and status
   - Link to dashboard

---

## Features & Benefits

### For Admin/Owner
✅ **Efficient Order Entry**: Quick form for phone/in-person orders
✅ **Flexible Payment**: Supports cash, cards, checks, digital payments
✅ **Automatic Calculations**: No manual math needed
✅ **Order Tracking**: View all orders with status updates
✅ **Email Automation**: Customers stay informed automatically
✅ **Role-Based Access**: Only owner/admin can access

### For Customers
✅ **Order Confirmation**: Immediate confirmation email
✅ **Status Updates**: Email notifications for all status changes
✅ **Order Tracking**: Know when orders ship and deliver
✅ **Professional Service**: Organized, tracked orders

### Business Value
- **Increase Sales**: Accept orders from multiple channels (phone, email, in-person)
- **Reduce Errors**: Automated calculations prevent mistakes
- **Save Time**: No manual email writing, automated notifications
- **Better Records**: All orders stored with complete history
- **Customer Trust**: Professional confirmation and tracking

---

## Troubleshooting

### Login Issues
**Problem**: "Admin/Owner access required"
- **Solution**: Ensure you're logging in with an owner or admin account
- Check credentials with Denise Robinson

### Order Not Saving
**Problem**: Order creation fails
- **Solution**: 
  - Ensure all required fields are filled (customer name, email, address, products)
  - Check HTTPS connection
  - Verify admin token is valid
  - Check server logs for errors

### Emails Not Sending
**Problem**: Customers don't receive order confirmation
- **Solution**:
  - Verify SMTP configuration in `.env`
  - Check email service provider (Gmail, SendGrid, etc.)
  - Ensure customer email is correct
  - Check spam folder
  - Contact Denise to verify email settings

### Orders Not Appearing
**Problem**: Orders created but don't show in list
- **Solution**:
  - Refresh the page
  - Check browser console for errors (F12)
  - Verify MongoDB connection
  - Check recent orders are sorted correctly (newest first)

---

## Best Practices

### Order Entry
✅ Always verify customer email spelling (critical for notifications)
✅ Include phone number for delivery coordination
✅ Use consistent product names across orders
✅ Add notes for special requests or gift messages

### Payment Processing
✅ For cash orders, update status after payment received
✅ Record payment reference for disputes
✅ Process card payments through Square before marking "completed"
✅ Refund failed payments promptly

### Customer Communication
✅ Use order confirmation as receipt for customers
✅ Update order status when shipment details available
✅ Include tracking numbers in shipped emails
✅ Follow up with delivered customers for reviews

---

## Security & Access Control

- **Authentication**: JWT tokens required for all API access
- **Authorization**: Only owner/admin users can access order management
- **Data Protection**: All API traffic encrypted with HTTPS/TLS
- **Input Sanitization**: All user inputs sanitized against injection attacks
- **Audit Trail**: All orders tracked with creator information
- **Email Security**: Order data sent through encrypted connections

---

## FAQ

**Q: Can regular customers create manual orders?**
A: No. Only owner and admin users can access the admin dashboard and create manual orders. This protects the system from unauthorized order creation.

**Q: What happens if I mark an order "failed" by mistake?**
A: You can update the status again to correct it. All status updates are tracked in the database.

**Q: Can I edit an order after creating it?**
A: Currently, order details are immutable after creation. Plan to add edit functionality in future updates.

**Q: What payment methods are supported?**
A: Cash, Credit/Debit Card, Check, Venmo, PayPal, and Other. All are manually tracked (no automatic payment processing in admin dashboard).

**Q: Are refunds automatic?**
A: Refunds are manual. Update payment status to "refunded" and process actual refund through payment processor separately.

**Q: Can I export orders?**
A: Currently viewing only in dashboard. API endpoints available for integration with export tools.

**Q: What currency is supported?**
A: Currently USD only. Amounts stored in cents for precision.

---

## Future Enhancements

📋 **Planned Features**:
- [ ] Edit/modify existing orders
- [ ] Bulk order import from CSV
- [ ] Automatic Square payment processing in dashboard
- [ ] Shipping label generation
- [ ] Custom invoices/receipts
- [ ] Advanced analytics and reporting
- [ ] Inventory management integration
- [ ] Multiple payment gateways

---

**Version**: 1.0  
**Last Updated**: January 15, 2026  
**For**: Sisters Promise  
**Contact**: denise@sisterspromise.com
