/** Shape of public.flow_analytics_rollup(): conversations and leads counted
 *  in SQL per UTC day, so totals aren't capped at PostgREST's 1000 rows. */
export interface FlowAnalyticsRollup {
  sessions: {
    day: string;
    flowId: string;
    accountId: string | null;
    status: string;
    stepOrder: number;
    count: number;
  }[];
  leads: { day: string; flowId: string; accountId: string | null; count: number }[];
  steps: { flowId: string; stepOrder: number }[];
}

export const EMPTY_FLOW_ROLLUP: FlowAnalyticsRollup = { sessions: [], leads: [], steps: [] };
