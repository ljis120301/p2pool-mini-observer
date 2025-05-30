# P2Pool Mini Observer

A modern, responsive web application for monitoring P2Pool Mini mining operations built with Next.js, Tailwind CSS 4, and Shadcn/ui components.

## Features

- 🎨 **Modern Dark/Light Theme** - Seamless theme switching with Tailwind 4
- 📊 **Real-time Pool Statistics** - Live hashrate, miners, blocks found, and effort tracking
- 🔍 **Individual Miner Tracking** - Monitor specific wallet performance and share history
- 🌐 **Mini P2Pool Focus** - Specifically designed for P2Pool Mini network
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Auto-refresh** - Real-time data updates every 30 seconds
- 🔧 **Simple Configuration** - Easy wallet tracking with automatic navigation

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fun
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using P2Pool Mini Observer

This application is pre-configured to connect to the P2Pool Mini network via the official Mini P2Pool Observer (`https://mini.p2pool.observer`).

### Tracking Your Mining

1. Enter your Monero wallet address in the configuration
2. Click "Track" to start monitoring your mining statistics
3. Automatically redirected to your personalized dashboard
4. View your shares, blocks found, and estimated rewards

### What is P2Pool Mini?

P2Pool Mini is a sidechain for P2Pool designed for miners with lower hashrates. It provides:

- Lower share difficulty
- More frequent payouts for smaller miners
- Same security and decentralization as main P2Pool
- Ideal for CPU and GPU miners

## API Support

This application supports the P2Pool Mini API:

- Pool information and statistics
- Individual miner data
- Recent shares and found blocks
- PPLNS window data
- Mining effort calculations

## Development

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 (latest)
- **Components**: Shadcn/ui with Radix primitives
- **Icons**: Lucide React
- **Theme**: Custom dark/light mode with system detection
- **Language**: TypeScript

### Theme System

The application uses a custom theme implementation with Tailwind 4:

- Uses `@custom-variant dark (&:is(.dark *))` for proper scoping
- CSS variables for all theme colors
- System theme detection with manual override
- Persistent theme preference storage

### P2Pool API Client

Located in `lib/p2pool-api.ts`, provides:

- Type-safe API interactions
- Connection timeout handling
- Error management
- Data formatting utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## P2Pool Mini Resources

- [P2Pool GitHub](https://github.com/SChernykh/p2pool)
- [P2Pool Mini Observer](https://mini.p2pool.observer/)
- [Gupax Mining GUI](https://github.com/hinto-janai/gupax)

## Support

For P2Pool Mini mining support:
- IRC: #p2pool-mini on libera.chat
- Reddit: r/MoneroMining
- Matrix: [P2Pool rooms](https://matrix.to/#/#p2pool:matrix.org)

For application issues:
- Create an issue in this repository
- Check existing issues first
