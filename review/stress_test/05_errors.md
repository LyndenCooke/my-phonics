# Pass 5 — Error path probing

| ID | Result | Detail |
|----|:-----:|--------|
| E2 | ✅ | Admin not accessible unsigned |
| E3 | ✅ | Stayed on /auth (inline validation) |
| E4 | ❌ | network unreachable: apiRequestContext.post: getaddrinfo ENOTFOUND qzwkyubbtjqpgqdthwal.supabase.co
Call log:
[2m  - → POST https://qzwkyubb |
| E5 | ✅ | Library rendered with all images blocked |