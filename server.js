const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

  // Worker processes run the HTTPS server

  const express = require('express');
  const app = express();
  const fs = require('fs');
  exports.jwt = require('jsonwebtoken');
  const helmet = require('helmet');
  exports.dotenv = require('dotenv').config();
  exports.applicationkey = process.env.APPLICATION_KEY;
  const port = process.env.PORT;
  const hostname = process.env.HOST_NAME;
  const dbname = process.env.MYSQL_DATABASE;
  const path = require('path');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(bodyParser.json({ limit: '50mb', extended: true }));
  //app.use(cors());
app.use(cors({
  origin: [
    'https://app.shipdartexpress.com',
    'https://crm.shipdartexpress.com',
    'https://admin.shipdartexpress.com:9445',
    'https://spstore.shipdartexpress.com:3000',
    'https://spstore.shipdartexpress.com',
    'https://shopify-app-3zy3.onrender.com',
    'https://rulor.shop',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
  const https = require('https');
  const schedule = require('node-schedule');

	const job = schedule.scheduleJob('*/30 * * * *', () => {
      console.log("Scheduler started");
      require('./services/global').updateTrackingDetails();
    });
	
	
	const job2 = schedule.scheduleJob("0 1 * * *", function () {
  console.log("Job executed at 1:00 AM!");
  require('./services/global').scheduleDelhiveryOrders()
});

  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/admin.shipdartexpress.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/admin.shipdartexpress.com/fullchain.pem'),
  };

  // Routes and Middleware
  const globalRoutes = require('./routes/global');
  app.use('/static', express.static(path.join(__dirname, './uploads')));

  app.use('/', function timeLog(req, res, next) {
    const supportKey = req.headers['supportkey'];
    console.log("Requested time:", new Date().toLocaleString(), "Requested Method:", req.method, req.url, "IP:", req.connection.remoteAddress, "SupportKey:", supportKey);
    const oldSend = res.send;
    res.send = function (data) {
      const logData = {
        method: req.method,
        route: req.url,
        date_time: require('./utilities/globalModule').getSystemDate(),
        request_headers: req.headers,
        request_body: req.body,
        response: data
      };
      const startdate = new Date();
      const filename = `${startdate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\s+/g, '_')}`;
      oldSend.apply(res, arguments);
    };
    next();
  });

  app.use('/', globalRoutes);
  app.use(helmet());
  app.disable('x-powered-by');

  https.createServer(options, app).listen(port, hostname, () => {
    console.log(`Worker ${process.pid} started HTTPS server at https://${hostname}:${port}`);
  });

