export interface ISummaryStats {
  summary: {
    from?: number; // Date from
    to?: number;    // Date to
    transactionData: {
      txCount: number;
      txSize: number;
      confirmed: number;
      unconfirmed: number;
      expired: number;
      orphaned: number;
    };
  },
  meta: {
    totalTx: number;
    totalSize: number;
  }
}
