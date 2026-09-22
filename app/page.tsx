import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { StatCard } from "@/components/aruna/StatCard";
import { LineChart } from "@/components/aruna/charts/LineChart";
import { brandCopy, landingCopy, lpQuoteCopy, sharedNavCopy } from "@/lib/content/copy";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { mockActiveCoverDetail } from "@/lib/mock/positions";
import { mockCohortTimeRemaining } from "@/lib/mock/cohorts";

const FEATURED_VAULT_ID = "weth-usdc-005";

const footerNavLinks = [
  { label: sharedNavCopy.markets, href: "/markets" },
  { label: sharedNavCopy.protect, href: "/protect" },
  { label: sharedNavCopy.underwrite, href: "/underwrite" },
  { label: sharedNavCopy.proof, href: "/proof" },
];

function formatUsdc(value: number) {
  return value.toLocaleString("en-US");
}

export default function LandingPage() {
  const vault = useVault(FEATURED_VAULT_ID).data;
  const cohort = useCohort(FEATURED_VAULT_ID).data;

  if (!vault || !cohort) {
    return null;
  }

  const poolLabelCompact = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const timeLeft = mockCohortTimeRemaining[cohort.id] ?? "";

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="landing" />

      <section className="flex flex-col lg:flex-row gap-[64px] items-start px-[24px] lg:px-[48px] pt-[56px] lg:pt-[88px] pb-[72px]">
        <div className="w-full lg:flex-1 lg:max-w-[660px] lg:min-w-0 flex flex-col gap-[28px]">
          <span className="font-mono text-[12px] tracking-[0.12em] text-accent">
            {landingCopy.hero.eyebrow}
          </span>
          <h1 className="font-display text-[42px] lg:text-[68px] leading-[1.04] font-normal text-foreground">
            {landingCopy.hero.heading}
          </h1>
          <p className="text-[19px] leading-[1.6] text-foreground-secondary max-w-[580px]">
            {landingCopy.hero.body}
          </p>
          <div className="flex gap-[14px] pt-[8px]">
            <Button href="/protect" icon={<ShieldCheckIcon />}>
              {landingCopy.hero.ctaProtect}
            </Button>
            <Button variant="ghost" href="/underwrite">
              {landingCopy.hero.ctaUnderwrite}
            </Button>
          </div>
        </div>

        <div className="w-full lg:flex-1 lg:min-w-0 border border-border bg-surface rounded-card-lg p-[28px] flex flex-col gap-[20px]">
          <div className="text-[11px] tracking-[0.08em] text-foreground-muted">
            {landingCopy.hero.liveCardLabel(poolLabelCompact)}
          </div>
          <div className="flex items-baseline gap-[12px]">
            <span className="font-mono text-[46px] text-accent">{cohort.realizedVolPercent}%</span>
            <span className="text-[14px] text-foreground-muted">
              {landingCopy.hero.realizedVolCaption}
            </span>
          </div>
          <LineChart
            viewBoxWidth={420}
            viewBoxHeight={120}
            className="w-full h-[120px]"
            ariaLabel="Realized variance accumulating against the strike"
            series={[
              {
                points: "0,118 48,110 96,99 144,86 192,74 240,63 288,50 336,41 384,34 420,30",
                tone: "accent",
              },
            ]}
            thresholds={[
              {
                y: 52 / 120,
                label: lpQuoteCopy.strikeLabel(`${mockActiveCoverDetail.strikePercent}%`),
                tone: "accent",
              },
            ]}
          />
          <div className="grid grid-cols-2 gap-[16px] border-t border-border pt-[18px]">
            <StatCard
              label={landingCopy.hero.vaultCapacityFreeLabel}
              value={`${formatUsdc(vault.freeCapacityUsdc)} USDC`}
            />
            <StatCard
              label={landingCopy.hero.cohortSettlesInLabel(cohort.id)}
              value={timeLeft}
            />
          </div>
        </div>
      </section>

      <section className="px-[24px] lg:px-[48px] pb-[80px]">
        <h2 className="font-display text-[30px] lg:text-[38px] font-normal mb-[8px]">
          {landingCopy.comparison.heading}
        </h2>
        <p className="text-[16px] text-foreground-secondary max-w-[720px] mb-[32px]">
          {landingCopy.comparison.body}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          <Card padding="default">
            <div className="flex justify-between items-baseline">
              <span className="text-[15px] font-semibold">{landingCopy.comparison.calmDrift.title}</span>
              <span className="font-mono text-[13px] text-positive">
                {landingCopy.comparison.calmDrift.volLabel}
              </span>
            </div>
            <LineChart
              viewBoxWidth={520}
              viewBoxHeight={140}
              className="w-full h-[140px] pt-[12px]"
              ariaLabel="Price drifting smoothly from one dollar to one dollar three cents"
              series={[
                {
                  points: "0,110 65,105 130,101 195,95 260,90 325,82 390,76 455,70 520,64",
                  tone: "positive",
                },
              ]}
            />
            <div className="text-[14px] text-foreground-secondary pt-[10px]">
              {landingCopy.comparison.calmDrift.body}
            </div>
          </Card>
          <Card padding="default">
            <div className="flex justify-between items-baseline">
              <span className="text-[15px] font-semibold">{landingCopy.comparison.whipsaw.title}</span>
              <span className="font-mono text-[13px] text-accent">
                {landingCopy.comparison.whipsaw.volLabel}
              </span>
            </div>
            <LineChart
              viewBoxWidth={520}
              viewBoxHeight={140}
              className="w-full h-[140px] pt-[12px]"
              ariaLabel="Price swinging sharply but ending at one dollar three cents"
              series={[
                {
                  points: "0,110 65,38 130,124 195,52 260,118 325,44 390,112 455,58 520,64",
                  tone: "accent",
                },
              ]}
            />
            <div className="text-[14px] text-foreground-secondary pt-[10px]">
              {landingCopy.comparison.whipsaw.body}
            </div>
          </Card>
        </div>
      </section>

      <section className="px-[24px] lg:px-[48px] pb-[80px]">
        <h2 className="font-display text-[30px] lg:text-[38px] font-normal mb-[32px]">
          {landingCopy.twoSides.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          <Card padding="lg" className="flex flex-col gap-[18px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-accent">
              {landingCopy.twoSides.lp.eyebrow}
            </span>
            <div className="font-display text-[27px] font-normal">{landingCopy.twoSides.lp.headline}</div>
            <ol className="list-decimal pl-[20px] text-[15px] leading-[1.85] text-foreground-secondary">
              {landingCopy.twoSides.lp.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="text-[14px] text-foreground-muted border-t border-border pt-[16px]">
              {landingCopy.twoSides.lp.footnote}
            </div>
          </Card>
          <Card padding="lg" className="flex flex-col gap-[18px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-positive">
              {landingCopy.twoSides.uw.eyebrow}
            </span>
            <div className="font-display text-[27px] font-normal">{landingCopy.twoSides.uw.headline}</div>
            <ol className="list-decimal pl-[20px] text-[15px] leading-[1.85] text-foreground-secondary">
              {landingCopy.twoSides.uw.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="text-[14px] text-foreground-muted border-t border-border pt-[16px]">
              {landingCopy.twoSides.uw.footnote}
            </div>
          </Card>
        </div>
      </section>

      <section className="px-[24px] lg:px-[48px] pb-[80px]">
        <h2 className="font-display text-[30px] lg:text-[38px] font-normal mb-[32px]">
          {landingCopy.refuse.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
          {landingCopy.refuse.cards.map((card) => (
            <Card key={card.title} padding="default">
              <div className="text-[16px] font-semibold pb-[10px]">{card.title}</div>
              <div className="text-[14.5px] leading-[1.65] text-foreground-secondary">{card.body}</div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border">
        <div className="px-[24px] lg:px-[48px] py-[40px] flex flex-col md:flex-row md:justify-between gap-[32px]">
          <div className="flex flex-col gap-[10px] max-w-[320px]">
            <span className="font-display text-[22px] text-foreground">{brandCopy.name}</span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-foreground-muted">
              {landingCopy.hero.eyebrow}
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-[32px] gap-y-[10px] text-[14px]">
            {footerNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-border px-[24px] lg:px-[48px] py-[20px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[8px] sm:gap-[16px]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-[4px] sm:gap-[16px]">
            <span className="font-mono text-[12px] text-foreground-muted">
              {landingCopy.footer.copyright(new Date().getFullYear())}
            </span>
            <span className="font-mono text-[12px] text-foreground-muted">
              {landingCopy.footer.disclaimer}
            </span>
          </div>
          <Link
            href="/proof"
            className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
          >
            {landingCopy.footer.proofLink}
          </Link>
        </div>
      </footer>
    </div>
  );
}
