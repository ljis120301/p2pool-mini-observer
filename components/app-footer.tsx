import Link from "next/link";
import { Github, Twitter, ExternalLink, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-16">
      <div className="bg-card border rounded-xl shadow-sm mx-4 my-4">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                  P2Pool Mini Observer
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Advanced P2Pool Mining Operations Dashboard. Track your mining performance, 
                network hashrate, and pool analytics in real-time.
              </p>
              <div className="flex items-center space-x-2 mb-4">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full mr-2 animate-pulse"></div>
                  Open Source
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full mr-2"></div>
                  Real-time
                </Badge>
              </div>
              <div className="flex space-x-3">
                <Link 
                  href="https://github.com/ljis120301/p2pool-mini-observer.git" 
                  target="_blank"
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition-all duration-200 group"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                </Link>
                <Link 
                  href="https://twitter.com/ljis120301" 
                  target="_blank"
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/40 dark:hover:to-cyan-800/40 rounded-lg border border-blue-300 dark:border-blue-700 transition-all duration-200 group"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link 
                    href="https://p2pool.io/mini/#pool" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>P2Pool.io Mini</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://github.com/SChernykh/p2pool" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>P2Pool GitHub</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://www.getmonero.org" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>Monero</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">About the Dev</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link 
                    href="https://whoisjason.me" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://bee.whoisjason.me" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>Blog</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://bgp.whoisjason.me" 
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span>BGP Route Checker</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {currentYear} P2Pool Mini Observer. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <Link 
                  href="/privacy" 
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 