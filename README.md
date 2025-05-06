# The Receipt Book

A flexible, generic receipt management system designed to support various types of receipts including donations, sales, and services - perfect for non-profit organizations, religious institutions, retail businesses, and service providers.

## Overview

The Receipt Book is a full-stack web application built to streamline the receipt management process. It helps organizations maintain accurate records, organize recipient information, and generate professional receipts for different purposes including:

- **Donation receipts** for religious organizations and non-profits
- **Sales receipts** for retail businesses
- **Service receipts** for service providers and consultants

## Key Features

### Multiple Receipt Types
- **Donation Receipts**: Track contributions to various funds with tax deduction information
- **Sales Receipts**: Generate detailed receipts with products, quantities, and unit prices 
- **Service Receipts**: Document services provided with warranty information
- Easily extend with custom receipt types for specific business needs

### Receipt Management
- Create and manage receipts of various types from a single interface
- Support for multiple items within a single receipt (funds, products, services)
- Automatic calculation of totals
- Type-specific receipt templates for printing and email
- Receipt history tracking and status management

### Contact Management
- Maintain a comprehensive database of contributors
- Track contribution history for each contact
- Categorize contacts by type (Individual, Institution, Foundation, etc.)
- Store contact details including name, email, phone, and address
- View total contribution amounts by contact

### Team Collaboration
- Multi-user support with role-based permissions
- Invite and manage team members with different access levels
- Secure authentication and authorization

### Financial Reporting
- Dashboard with key metrics and recent activity
- Customizable currency settings
- Track contributions across different fund categories

## Technology Stack

This application is built using modern web technologies:

- **Frontend**:
  - [Next.js](https://nextjs.org/) - React framework with App Router
  - [React](https://react.dev/) - UI library
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
  - [shadcn/ui](https://ui.shadcn.com/) - Accessible component library

- **Backend**:
  - [Convex](https://convex.dev/) - Backend platform with real-time database and server functions
  - [Clerk](https://clerk.com/) - Authentication and user management

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/the-receipt-book.git
cd the-receipt-book
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```
# Create a .env.local file with the following variables
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. Start the development server
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js application routes and pages
- `/components` - Reusable React components
- `/convex` - Convex backend functions, schema, and queries
- `/lib` - Utility functions and helpers
- `/public` - Static assets

## Features in Detail

### Receipt Generation
- Create new receipts with multiple fund categories
- Auto-complete contributor information from contacts
- Customizable receipt templates
- PDF download and email capabilities

### Contact Management
- Contact search and filtering
- Automatic creation of new contacts from receipts
- Contact type management with custom categories
- Detailed contact profiles with contribution history

### Fund Categories
- Organize contributions by purpose or destination
- Custom fund categories with descriptions
- Track totals by fund category

### Organization Settings
- Customize currency settings (symbol, code)
- Organization profile management
- Receipt numbering preferences

## Testing the New Generic Receipt System

After the recent update, the receipt system now supports multiple receipt types. To test this functionality:

1. Create a new receipt and select one of the available receipt types (Donation, Sales, Service)
2. Notice how the form adapts to show different fields based on the selected type:
   - Sales receipts show quantity and unit price fields
   - Donation receipts focus on fund categories
   - Service receipts emphasize service descriptions
3. Select an appropriate template for your receipt type
4. Fill in recipient information and add items specific to your receipt type
5. Generate the receipt and notice how the formatting and content change based on the receipt type

Each receipt type has its own set of categories and templates, making the system truly flexible for various business needs.

## Usage Examples

### Creating a Donation Receipt

Perfect for religious organizations, charities, or any non-profit accepting donations:

1. Select "Donation" as the receipt type
2. Choose a donation receipt template
3. Enter contributor information
4. Add fund categories and contribution amounts
5. Generate and send the receipt with tax deduction information

### Creating a Sales Receipt

Ideal for retail businesses selling products:

1. Select "Sales" as the receipt type
2. Choose a sales receipt template 
3. Enter customer information
4. Add products with quantities and unit prices
5. Generate and send the detailed sales receipt

### Creating a Service Receipt

Great for consultants, freelancers, or service providers:

1. Select "Service" as the receipt type
2. Choose a service receipt template
3. Enter client information
4. Add services rendered with respective costs
5. Generate and send the service receipt with warranty information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped build and improve this application
- Built with [Convex](https://convex.dev/), [Next.js](https://nextjs.org/), and [Clerk](https://clerk.com/)