import Link from "next/link";
import { StateCard } from "@/components/aruna/StateCard";
import { statesCopy } from "@/lib/content/copy";

export default function StatesPage() {
  const { cards } = statesCopy;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground px-[24px] lg:px-[32px] py-[36px]">
      <div className="pb-[24px]">
        <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{statesCopy.pageHeading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px]">{statesCopy.pageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        <StateCard
          title={cards.notEnoughCapacity.title}
          tag={cards.notEnoughCapacity.tag}
          tone="negative"
          message={cards.notEnoughCapacity.message}
          actions={[
            { label: cards.notEnoughCapacity.actions[0], variant: "primary" },
            { label: cards.notEnoughCapacity.actions[1], variant: "ghost" },
          ]}
          footnote={cards.notEnoughCapacity.footnote}
        />

        <StateCard
          title={cards.cohortNearlyOver.title}
          tag={cards.cohortNearlyOver.tag}
          tone="accent"
          message={cards.cohortNearlyOver.message}
          actions={[
            { label: cards.cohortNearlyOver.actions[0], variant: "primary" },
            { label: cards.cohortNearlyOver.actions[1], variant: "ghost" },
          ]}
          footnote={cards.cohortNearlyOver.footnote}
        />

        <StateCard
          title={cards.oracleSamplesMissed.title}
          tag={cards.oracleSamplesMissed.tag}
          tone="negative"
          message={
            <div>
              <div>{cards.oracleSamplesMissed.message}</div>
              <div className="font-mono text-[12px] text-foreground-muted pt-[10px]">
                {cards.oracleSamplesMissed.gapsLine}
              </div>
            </div>
          }
          footnote={cards.oracleSamplesMissed.footnote}
        />

        <StateCard
          title={cards.betweenCycles.title}
          tag={cards.betweenCycles.tag}
          tone="neutral"
          message={
            <div>
              <div>{cards.betweenCycles.message}</div>
              <div className="h-[6px] bg-border rounded-progress-thin mt-[14px]">
                <div className="h-[6px] w-[60%] bg-accent rounded-progress-thin" />
              </div>
              <div className="font-mono text-[12px] text-foreground-muted pt-[8px]">
                {cards.betweenCycles.progressCaption}
              </div>
            </div>
          }
          footnote={cards.betweenCycles.footnote}
        />

        <StateCard
          title={cards.noPositionsFound.title}
          tag={cards.noPositionsFound.tag}
          tone="neutral"
          message={cards.noPositionsFound.message}
          actions={cards.noPositionsFound.actions.map((label) => ({ label, variant: "ghost" as const }))}
          footnote={cards.noPositionsFound.footnote}
        />

        <StateCard
          title={cards.noVaultForPool.title}
          tag={cards.noVaultForPool.tag}
          tone="neutral"
          message={cards.noVaultForPool.message}
          actions={cards.noVaultForPool.actions.map((label) => ({ label, variant: "ghost" as const }))}
          footnote={cards.noVaultForPool.footnote}
        />

        <StateCard
          title={cards.quoteExpired.title}
          tag={cards.quoteExpired.tag}
          tone="accent"
          message={cards.quoteExpired.message}
          actions={[{ label: cards.quoteExpired.actions[0], variant: "primary" }]}
          footnote={cards.quoteExpired.footnote}
        />

        <StateCard
          title={cards.wrongNetwork.title}
          tag={cards.wrongNetwork.tag}
          tone="negative"
          message={cards.wrongNetwork.message}
          actions={[{ label: cards.wrongNetwork.actions[0], variant: "primary" }]}
          footnote={cards.wrongNetwork.footnote}
        />
      </div>

      <div className="mt-auto pt-[20px] border-t border-border flex flex-col sm:flex-row justify-between gap-[8px] text-[13px] text-foreground-muted">
        <span>{statesCopy.pageFootnote}</span>
        <Link href="/" className="text-foreground-muted">
          {statesCopy.backLink}
        </Link>
      </div>
    </div>
  );
}
