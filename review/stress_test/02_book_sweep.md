# Pass 2 — Interactive book walk

Books tested: **33** / 33
Opened + walked: **0**
Locked for QA user: **33**
Unknown failure: **0**

> ⚠️ Most books are locked for the QA user. The seed SQL only inserts `user_books` rows for books that exist in the `books` table, so if that table is sparse in production almost nothing gets unlocked. Re-seed or add an `is_free_sample=true` flag to verify reader coverage.


## Per-book results

| Sub-level | Status | Pages walked | Console errors | Failed requests |
|-----------|--------|-------------:|---------------:|----------------:|
| L1.1 | 🔒 locked | 0 | 7 | 0 |
| L1.2 | 🔒 locked | 0 | 7 | 0 |
| L1.3 | 🔒 locked | 0 | 7 | 0 |
| L1.4 | 🔒 locked | 0 | 7 | 0 |
| L1.5 | 🔒 locked | 0 | 7 | 0 |
| L1.6 | 🔒 locked | 0 | 7 | 0 |
| L1.7 | 🔒 locked | 0 | 7 | 0 |
| L1.8 | 🔒 locked | 0 | 7 | 0 |
| L1.9 | 🔒 locked | 0 | 7 | 0 |
| L1.10 | 🔒 locked | 0 | 7 | 0 |
| L2.1 | 🔒 locked | 0 | 7 | 0 |
| L2.2 | 🔒 locked | 0 | 7 | 0 |
| L2.3 | 🔒 locked | 0 | 7 | 0 |
| L2.4 | 🔒 locked | 0 | 7 | 0 |
| L2.5 | 🔒 locked | 0 | 7 | 0 |
| L2.6 | 🔒 locked | 0 | 7 | 0 |
| L3.1 | 🔒 locked | 0 | 7 | 0 |
| L3.2 | 🔒 locked | 0 | 7 | 0 |
| L3.3 | 🔒 locked | 0 | 7 | 0 |
| L3.4 | 🔒 locked | 0 | 7 | 0 |
| L3.5 | 🔒 locked | 0 | 7 | 0 |
| L4.1 | 🔒 locked | 0 | 7 | 0 |
| L4.2 | 🔒 locked | 0 | 7 | 0 |
| L4.3 | 🔒 locked | 0 | 7 | 0 |
| L4.4 | 🔒 locked | 0 | 7 | 0 |
| L5.1 | 🔒 locked | 0 | 7 | 0 |
| L5.2 | 🔒 locked | 0 | 7 | 0 |
| L5.3 | 🔒 locked | 0 | 7 | 0 |
| L5.4 | 🔒 locked | 0 | 7 | 0 |
| L6.1 | 🔒 locked | 0 | 7 | 0 |
| L6.2 | 🔒 locked | 0 | 7 | 0 |
| L6.3 | 🔒 locked | 0 | 7 | 0 |
| L6.4 | 🔒 locked | 0 | 7 | 0 |

## Issues

### L1.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.5
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.6
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.7
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.8
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.9
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L1.10
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.5
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L2.6
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L3.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L3.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L3.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L3.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L3.5
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L4.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L4.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L4.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L4.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L5.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L5.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L5.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L5.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L6.1
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L6.2
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L6.3
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### L6.4
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** TypeError: Failed to fetch
    at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=1d49830e:10436:23
    at _handleRequest2 (http://localhost:8080/node_modules/.vite/deps/@supa
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- **console error:** Failed to load resource: net::ERR_NAME_NOT_RESOLVED
