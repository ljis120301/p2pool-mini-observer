# P2Pool Mini Observer

A web app for monitoring P2Pool Mini mining operations. Track your mining stats, view pool information, and monitor your wallet performance in real-time.

<img width="1422" alt="Screenshot 2025-06-16 at 9 26 26 AM" src="https://github.com/user-attachments/assets/2c1e036f-433a-4bd3-b398-fc9c23041604" />

## Quick Setup

**Requirements:** Node.js 18+

```bash
# Clone and install
git clone <repository-url>
cd fun
npm install

# Run the app
npm run dev
```

Open http://localhost:3000 in your browser.

## How to Use

1. **Enter your Monero wallet address** in the tracker
2. **Click "Track"** to view your mining dashboard
3. **Monitor your stats** - shares, blocks found, estimated rewards

The app automatically connects to the P2Pool Mini network and refreshes data every 30 seconds.

## Features

- Real-time pool and miner statistics
- Individual wallet tracking
- Dark/light theme support
- Responsive design
- Auto-refresh every 30 seconds

## Development

Built with Next.js 15, TypeScript, Tailwind CSS 4, and Shadcn/ui components.
