# The Receipt Book

A comprehensive donation and receipt management system designed for non-profit organizations and religious institutions to efficiently track contributions, manage contacts, and generate professional receipts.

## Overview

The Receipt Book is a full-stack web application built to streamline the donation management process. It helps organizations maintain accurate records of contributions, organize contributor information, and generate professional receipts for tax and record-keeping purposes.

## Key Features

### Receipt Management
- Create and manage donation receipts
- Support for multiple fund categories within a single receipt
- Automatic calculation of totals
- Professional receipt templates for printing and email
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped build and improve this application
- Built with [Convex](https://convex.dev/), [Next.js](https://nextjs.org/), and [Clerk](https://clerk.com/)