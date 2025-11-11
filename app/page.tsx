'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Shuffle } from '@/components/ui/shuffle';
import { ArrowRight, Zap, Shield, DollarSign } from 'lucide-react';
import Link from 'next/link';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8; // Slow down slightly for better viewing
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden dark">
      <Header theme="dark" />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover grayscale scale-130 brightness-80"
            >
            <source src="/encryption.webm" type="video/webm"/>
            Your browser does not support the video tag.
          </video>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="mb-6">
            <Shuffle
              text="FURO"
              tag="h1"
              duration={0.6}
              maxDelay={0.3}
              shuffleTimes={3}
              scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
              triggerOnce={true}
              className="text-[100px] md:text-[150px] lg:text-[200px]"
              colorFrom="#ffffff80"
              colorTo="#ffffff"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '900'
              }}
            />
          </div>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto shadow-lg font-semibold text-white mix-blend-difference">
            The First API Marketplace with Crypto Micropayments
          </p>
          <p className="text-lg mb-12 text-muted-foreground/80 max-w-2xl mx-auto shadow-lg">
            Monetize your APIs with per-call payments using the x402 protocol.
            No subscriptions, no minimums — just pay for what you use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg">
                Explore APIs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/list-api">
              <Button size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/10 px-8 py-4 text-lg">
                List Your API
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose Furo?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Pay Per Call</h3>
              <p className="text-muted-foreground">
                No monthly subscriptions or minimum commitments.
                Pay only for the API calls you actually use.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
              <p className="text-muted-foreground">
                Powered by blockchain technology with end-to-end encryption
                and transparent payment verification.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Access</h3>
              <p className="text-muted-foreground">
                No lengthy approval processes. Connect your wallet,
                pay, and get instant access to premium APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-4 relative">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover blur-md brightness-75"
          >
            <source src="/encryption.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background/0 to-background/60" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Powered by x402 Protocol
              </h2>
              <p className="text-xl mb-8 text-muted-foreground/80">
                Built on industry standards for decentralized payments,
                ensuring compatibility and security across the ecosystem.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Multi-chain support (Ethereum, Polygon, Base, more)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Transparent on-chain payment verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Developer-friendly SDK and integration tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Automated dispute resolution and reputation system</span>
                </div>
              </div>

              <Link href="/marketplace">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="hidden md:block">
              {/* Visual representation of x402 protocol */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Request</span>
                    <span className="text-sm text-primary">402 Payment Required</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payment</span>
                    <span className="text-sm text-green-600">✓ Verified</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Response</span>
                    <span className="text-sm text-accent-foreground">API Data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-secondary/20 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the API Revolution?
          </h2>
          <p className="text-xl mb-12 text-muted-foreground/80">
            Whether you're looking to monetize your APIs or access premium services,
            Furo provides the infrastructure for the decentralized API economy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg">
                Explore Marketplace
              </Button>
            </Link>
            <Link href="/list-api">
              <Button size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/10 px-8 py-4 text-lg">
                Start Monetizing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}