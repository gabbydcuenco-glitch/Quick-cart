require('./installation.js').initialize().then(values => console.log('QuickCart: http://localhost:' + values.QUICKCART_PORT)).catch(error => { console.error(error.message); process.exitCode = 1; });
