import { mediaCanonicalKey } from "./canonicalize";
import { fetchAndParseFeed } from "./feeds";
import { probeUrl } from "./viability";
import type {
  FeedConfig,
  FluxStore,
  MediaItem,
  SweepLogEntry,
  SweepProposal,
} from "../types";
import { newId } from "../types";

export type SweepResult = {
  storePatch: Partial<
    Pick<FluxStore, "proposals" | "media" | "sweepLog" | "settings">
  >;
  proposals: SweepProposal[];
  log: SweepLogEntry;
};

function existingCanonicals(store: FluxStore): Set<string> {
  const set = new Set<string>();
  for (const m of Object.values(store.media)) {
    if (m.canonicalKey) set.add(m.canonicalKey);
    else set.add(mediaCanonicalKey({ url: m.url, title: m.title }));
  }
  for (const p of Object.values(store.proposals)) {
    set.add(p.canonicalKey);
  }
  return set;
}

export async function runSweep(
  store: FluxStore,
  trigger: "manual" | "scheduled",
  scheduledKey?: string,
): Promise<SweepResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let feedsChecked = 0;
  let urlsProbed = 0;
  let proposed = 0;
  let skippedDead = 0;
  let skippedDupe = 0;

  const seen = existingCanonicals(store);
  const proposalsMap: Record<string, SweepProposal> = { ...store.proposals };
  const mediaUpdates: Record<string, MediaItem> = { ...store.media };
  const added: SweepProposal[] = [];

  const enabledFeeds = Object.values(store.feeds).filter(
    (f) => f.enabled && f.availability === "public_rss" && f.url,
  );

  for (const feed of enabledFeeds) {
    feedsChecked += 1;
    try {
      const items = await fetchAndParseFeed(feed.url!);
      for (const item of items) {
        const canonicalKey = mediaCanonicalKey({
          url: item.url,
          title: item.title,
        });
        if (seen.has(canonicalKey)) {
          skippedDupe += 1;
          continue;
        }
        urlsProbed += 1;
        const viability = await probeUrl(item.url, { strictCors: false });
        if (!viability.ok) {
          skippedDead += 1;
          continue;
        }
        seen.add(canonicalKey);
        const id = newId("prop");
        const proposal: SweepProposal = {
          id,
          title: item.title,
          url: item.url,
          canonicalKey,
          feedId: feed.id,
          channelId: feed.channelId,
          viable: true,
          foundAt: new Date().toISOString(),
          summary: item.summary,
        };
        proposalsMap[id] = proposal;
        added.push(proposal);
        proposed += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${feed.label}: ${msg}`);
    }
  }

  // Re-check user-pasted URLs only
  for (const m of Object.values(store.media)) {
    if (m.sourceKind !== "url" || !m.url) continue;
    urlsProbed += 1;
    const viability = await probeUrl(m.url, { strictCors: false });
    mediaUpdates[m.id] = {
      ...m,
      viable: viability.ok,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  const finishedAt = new Date().toISOString();
  const log: SweepLogEntry = {
    id: newId("sweep"),
    startedAt,
    finishedAt,
    trigger,
    feedsChecked,
    urlsProbed,
    proposed,
    skippedDead,
    skippedDupe,
    errors,
  };

  const settings = { ...store.settings };
  if (trigger === "scheduled" && scheduledKey) {
    settings.lastScheduledSweepKey = scheduledKey;
  }

  return {
    proposals: added,
    log,
    storePatch: {
      proposals: proposalsMap,
      media: mediaUpdates,
      sweepLog: [log, ...store.sweepLog].slice(0, 30),
      settings,
    },
  };
}

export function proposalToMedia(
  proposal: SweepProposal,
  feed: FeedConfig | undefined,
): MediaItem {
  return {
    id: newId("media"),
    title: proposal.title,
    sourceKind: "rss",
    url: proposal.url,
    canonicalKey: proposal.canonicalKey,
    feedId: proposal.feedId,
    channelId: proposal.channelId,
    platformId: feed?.channelId === "tve1" ? "rtve" : undefined,
    notes: proposal.summary,
    viable: true,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
