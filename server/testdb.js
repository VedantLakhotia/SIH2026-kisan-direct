const pool = require('./db');

pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'").then(res => {
    console.log(res.rows);
    process.exit(0);
});
