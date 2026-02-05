import { Award, Users, ClipboardCheck, Bell, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Training Certify</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Catalog
            </Link>
            <Link href="/team-management" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Teams
            </Link>
            <Link href="/compliance-audit" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Compliance
            </Link>
            <Link href="/notifications" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Notifications
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Streamline Your Team's
            <span className="block text-primary">Certification Management</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track certifications, ensure compliance, and empower your workforce with a comprehensive 
            training management platform designed for modern organizations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link 
              href="/catalog" 
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Certifications
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/team-management" 
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors"
            >
              Manage Your Team
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Award className="h-6 w-6" />}
            title="Certification Catalog"
            description="Browse and discover certifications from leading providers like Microsoft, AWS, Cisco, and more."
            href="/catalog"
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Team Management"
            description="Organize teams, assign certifications, and track progress across your entire workforce."
            href="/team-management"
          />
          <FeatureCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Compliance Tracking"
            description="Stay audit-ready with comprehensive compliance dashboards and automated reporting."
            href="/compliance-audit"
          />
          <FeatureCard
            icon={<Bell className="h-6 w-6" />}
            title="Smart Notifications"
            description="Never miss an expiration with customizable alerts and renewal reminders."
            href="/notifications"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="mt-2 text-sm text-muted-foreground">Certifications Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="mt-2 text-sm text-muted-foreground">Compliance Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="mt-2 text-sm text-muted-foreground">Monitoring & Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary/5 p-8 text-center lg:p-16">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Ready to simplify certification management?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join organizations that trust Training Certify to keep their teams certified and compliant.
          </p>
          <Link 
            href="/sign-up" 
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Training Certify</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Training Certify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
