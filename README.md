# ClaimCutter - UK Small Claims Guide

A desktop + web application that guides members of the public through the entire process of making a small claim in England and Wales.

## Features

- **Eligibility Checker** - Quick assessment of whether your case qualifies for small claims
- **Letter Before Claim Generator** - Auto-generate professional letters with templates
- **Claim Builder** - Step-by-step wizard to collect all information needed for the N1 claim form
- **Fee Calculator** - Accurate court fee calculation based on claim amount
- **Interest Calculator** - Automatic statutory interest calculation (8% per year)
- **Submission Guide** - Guidance for both online (MCOL) and paper submission
- **Claim Tracker** - Visual timeline with key dates and deadlines
- **Mediation Preparation** - Position statement templates and preparation checklists
- **Hearing Preparation** - Evidence organizer, witness statement templates, FAQ
- **Enforcement Guide** - Step-by-step guidance for all enforcement options
- **Document Management** - Secure local storage of all case documents

## Tech Stack

- **Electron** - Cross-platform desktop application
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - State management
- **React Hook Form + Zod** - Form validation
- **IndexedDB (idb)** - Local data persistence
- **PWA** - Progressive Web App capabilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/claimcutter.git
cd claimcutter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Start Vite dev server (web mode)
npm run dev

# Start Electron dev mode (desktop mode)
npm run electron:dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Building for Production

```bash
# Build web version
npm run build

# Build desktop app for all platforms
npm run electron:build

# Build for specific platform
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

## Project Structure

```
claimcutter/
├── electron/           # Electron main process files
│   ├── main.ts         # Main Electron entry point
│   └── preload.ts      # Preload script for secure IPC
├── public/             # Static assets
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service worker
│   └── offline.html    # Offline fallback page
├── src/
│   ├── components/     # Reusable React components
│   │   ├── Layout.tsx
│   │   ├── WizardStep.tsx
│   │   ├── DisclaimerModal.tsx
│   │   └── ...
│   ├── pages/          # Page components
│   │   ├── WelcomePage.tsx
│   │   ├── EligibilityPage.tsx
│   │   ├── PreClaimPage.tsx
│   │   ├── ClaimBuilderPage.tsx
│   │   └── ...
│   ├── types/          # TypeScript type definitions
│   ├── schemas/        # Zod validation schemas
│   ├── store/          # Zustand state management
│   ├── services/       # Data storage service
│   ├── utils/          # Utility functions
│   │   ├── feeCalculator.ts
│   │   ├── interestCalculator.ts
│   │   └── eligibilityChecker.ts
│   ├── tests/          # Test files
│   ├── App.tsx         # Main App component
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # TailwindCSS configuration
└── package.json        # Project dependencies
```

## Key Features Explained

### Eligibility Checker

Checks:
- Jurisdiction (England and Wales only)
- Claim amount (up to £10,000)
- Personal injury limits (£1,000 general, £5,000 road traffic)
- Housing disrepair limits (£1,000)
- Time limits (6 years from breach)
- Excluded claim types (defamation, etc.)

### Fee Calculator

Current court fees (verified January 2024):

| Claim Amount | Online Fee | Paper Fee |
|---|---|---|
| Up to £300 | £25 | £35 |
| £300.01 – £500 | £35 | £50 |
| £500.01 – £1,000 | £60 | £70 |
| £1,000.01 – £1,500 | £70 | £80 |
| £1,500.01 – £3,000 | £80 | £115 |
| £3,000.01 – £5,000 | £180 | £205 |
| £5,000.01 – £10,000 | £455 | £520 |
| Over £10,000 | 5% | 5% |

### Interest Calculator

- Statutory rate: 8% per year (County Courts Act 1984)
- Calculates from date money was owed to claim date
- Daily rate calculation for precision

### Letter Before Claim

- Professional template with all required elements
- References Pre-Action Protocol
- 14-day response deadline (individuals) / 30 days (businesses)
- Print, PDF export, or email options

## Data Privacy

- **All data stored locally** on your device
- No data sent to external servers
- GDPR compliant
- Export and delete your data at any time
- Optional encrypted cloud backup (user's choice)

## Disclaimer

ClaimCutter provides **information and guidance** based on publicly available government sources. It does **not** constitute legal advice. For complex cases, users should seek professional legal advice from a qualified solicitor.

Official resources:
- [GOV.UK - Make a court claim for money](https://www.gov.uk/make-court-claim-for-money)
- [Citizens Advice](https://www.citizensadvice.org.uk/)
- [Money Claim Online](https://www.gov.uk/make-court-claim-for-money/make-claim)

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.