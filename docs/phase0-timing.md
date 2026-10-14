# Load time and download size (test build)

Measured by `tests/step5-load.sh` on: Apple M5, 10 cores, 16 GB RAM, Darwin 25.6.0, Chromium 145.0.7632.6 (headless, Playwright). Local web server, so there is no network delay: the times are the browser's own work (download from disk, unpack, start Python). Dataset: the 5-point example, weighted straight line.

| | First visit | Repeat visit (cache) |
|---|---|---|
| Ready to fit (button enabled) | 2.7 s | 2.5 s |
| Bytes loaded from the network | 35.4 MB | 0.0 MB |
| Time for one fit (press "Anpassen" to result) | 36 ms | 36 ms |

Files loaded on a first visit: 16. Total size: 35.5 MB as stored, about 24.7 MB gzip-compressed (what a real server would send).
Estimated first-visit download time: about 4.0 s at 50 Mbit/s, about 19.8 s at 10 Mbit/s (university Wi-Fi in a crowded lecture hall), plus the browser's own 2.7 s.

The repeat visit works only because the server sends `cache-control: public, max-age=3600` (or longer). The real hosting must do the same, and must also compress (gzip or brotli). Measured once with a throw-away in-memory browser profile (like a private window): the two largest files (the SciPy package and the Python engine, together 23.6 MB as stored) were downloaded again on the repeat visit. A normal window with a disk cache did not.
