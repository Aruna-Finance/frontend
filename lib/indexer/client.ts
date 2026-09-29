import { GraphQLClient, ClientError } from "graphql-request";
import { toast } from "@/lib/toast";

// No production indexer URL yet (hosting not chosen, see the FE<->indexer
// checklist). Falls back to the local `pnpm dev` default so this works out of
// the box while developing against a local Ponder instance.
const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:42069/graphql";

const client = new GraphQLClient(INDEXER_URL);

// The indexer can lag a few blocks behind or be mid-backfill; never let that
// look like a silent empty state. Every caller goes through this so failures
// always surface the same way.
export async function indexerRequest<TResult, TVariables extends object | undefined = undefined>(
  query: string,
  variables?: TVariables,
): Promise<TResult> {
  try {
    return await client.request<TResult>(query, variables);
  } catch (error) {
    const description =
      error instanceof ClientError
        ? (error.response.errors?.[0]?.message ?? "The indexer returned an error.")
        : "Could not reach the indexer.";
    toast.error("Indexer request failed", { id: "indexer-error", description });
    throw error;
  }
}
