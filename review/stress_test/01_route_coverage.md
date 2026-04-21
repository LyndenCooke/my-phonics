# Pass 1 — Route coverage

Routes tested: **27**

Routes with issues: **7**


## Per-route results

| Route | Status | Load (ms) | Heading | Errors | 4xx/5xx |
|-------|-------:|----------:|---------|-------:|--------:|
| `/` | 200 | 866 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/auth` | 200 | 370 | MyPhonicsBooks | 0 | 0 |
| `/library` | 200 | 570 | MyPhonicsBooks | 3 | 0 |
| `/assess` | 200 | 484 | MyPhonicsBooks | 0 | 0 |
| `/shop` | 200 | 458 | MyPhonicsBooks | 2 | 0 |
| `/progress` | 200 | 944 | MyPhonicsBooks | 0 | 0 |
| `/profile` | 200 | 1054 | MyPhonicsBooks | 0 | 0 |
| `/welcome` | 200 | 870 | MyPhonicsBooks | 1 | 0 |
| `/payment-success` | 200 | 1718 | MyPhonicsBooks | 0 | 0 |
| `/reset-password` | 200 | 1071 | — | 0 | 0 |
| `/privacy` | 200 | 977 | Privacy Policy | 0 | 0 |
| `/terms` | 200 | 354 | Terms of Service | 0 | 0 |
| `/links` | 200 | 657 | MyPhonicsBooks | 0 | 0 |
| `/f/wrong-books` | 200 | 412 | Wrong books kill confidence | 0 | 0 |
| `/f/free-assessment` | 200 | 408 | Still guessing their reading level? | 0 | 0 |
| `/f/3-minute-check` | 200 | 1527 | 3 minutes to find their exact reading level | 0 | 0 |
| `/f/the-gap` | 200 | 1224 | Boring books they can read.Great books they can't. | 0 | 0 |
| `/admin` | 200 | 1860 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/admin/customers` | 200 | 897 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/admin/pipeline` | 200 | 1146 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/admin/deals` | 200 | 956 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/admin/tasks` | 200 | 641 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/admin/analytics` | 200 | 1105 | Learn to Read with Beautiful Phonics Books | 0 | 0 |
| `/library?book=L1.1` | 200 | 521 | MyPhonicsBooks | 3 | 0 |
| `/library?book=L3.1` | 200 | 1226 | MyPhonicsBooks | 2 | 0 |
| `/library?book=L5.1` | 200 | 1188 | MyPhonicsBooks | 3 | 0 |
| `/library?book=L6.4` | 200 | 2145 | MyPhonicsBooks | 3 | 0 |

## Console errors

### `/library`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/shop`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/welcome`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/library?book=L1.1`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/library?book=L3.1`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/library?book=L5.1`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED

### `/library?book=L6.4`
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED
- Failed to load resource: net::ERR_NAME_NOT_RESOLVED


## Failed network requests
