# QuickCart v8

Restores the requested colored Local URL display: http://localhost:8080/.
Vite remains local-only. No Network URLs are printed. The real selected port is
shown: if 8080 is busy, the next free port is used, as requested.

The listener remains on IPv4 loopback to avoid exposing the app to the network.
Regression checks fetch both the underlying loopback address and the displayed
localhost address. Docker startup, dependencies, test commands, application
features and image reuse are unchanged from v7.
