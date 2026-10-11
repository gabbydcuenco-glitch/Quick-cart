# Gabay sa QuickCart

1. I-extract ang ZIP sa folder sa laptop.
2. Buksan ang Docker Desktop at hintaying running ang engine.
3. Kailangan ang Node.js 22.12 o mas bago.
4. Buksan ang terminal sa project folder at patakbuhin:

       npm install
       npm run dev

Lalabas ang Vite at ang Local link, karaniwang http://localhost:8080/. Buksan ang eksaktong link na nakalagay sa terminal. Iwanang bukas ang terminal; Ctrl+C para ihinto ang Vite.

Walang kailangang database password at walang kokopyahing password mula sa ibang laptop. Awtomatikong inaayos ang lumang password setup ng sariling database ng installation. Hindi binubura ang existing orders.

Kailangan pa rin ang running Docker database at APIs. Kapag tumigil ang Docker/backend, hindi magagamit ang shop at hihinto rin ang Vite matapos ang sunod-sunod na failed checks.

Para lahat ay served sa Docker, gamitin ang npm start o double-click START-QUICKCART.cmd. Para ihinto ang containers habang pinapanatili ang data, gamitin ang npm stop.

Ang .env ay para sa installation ID, port, image tag, at database username lang. Walang password. Bawat laptop ay may sariling local database. Basahin ang START-HERE.md para sa buong instructions.


Kasama ulit ang automatic pag-install ng missing dependencies kapag npm run dev. Normal na makita ang .js setup at installation logs bago ang Vite. Hiwalay ang Jenkins: npm run jenkins.

