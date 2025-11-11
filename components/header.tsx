'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  theme?: 'dark' | 'light';
}

export function Header({ theme = 'light' }: HeaderProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isMarketplacePage = pathname === '/marketplace';

  const headerClasses = theme === 'dark'
    ? 'border-b border-border bg-background/50 backdrop-blur-md dark'
    : 'border-b bg-background';

  const logoClasses = theme === 'dark'
    ? 'text-2xl font-bold text-foreground'
    : 'text-2xl font-bold text-primary';

  const inputClasses = theme === 'dark'
    ? 'pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground'
    : 'pl-10';

  const buttonClasses = theme === 'dark'
    ? 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
    : '';

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className={logoClasses}>
          Furo
        </Link>

        {/* Show search only on marketplace page */}
        {isMarketplacePage && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search APIs..."
                className={inputClasses}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Show Marketplace button on landing page */}
          {isLandingPage && (
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className={buttonClasses}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
          )}

          <Link href="/list-api">
            <Button variant="outline" size="sm" className={buttonClasses}>
              <Plus className="h-4 w-4 mr-2" />
              List API
            </Button>
          </Link>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}