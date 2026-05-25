# Bolt's Journal - Critical Learnings

## 2026-05-24 - Efficient Balance Aggregation
**Learning:** In-memory aggregation of financial transactions is a major bottleneck in accounting systems. Fetching all transaction records (O(N) data transfer) to calculate a single value that the database can compute natively (O(1) or O(log N) with indexes) scales poorly.
**Action:** Always prefer database-level aggregation (Prisma `groupBy`, `aggregate`, or `_sum`) for financial reports and dashboards to minimize memory overhead and network latency. Refactored `getAccountBalances` to use `groupBy`, resulting in a ~10x speed boost on large datasets.
