//Required packages

const express = require('express');

const vehicleRoute = require('./routes/vehicleRoute');
const customerFunctionalityRoutes = require('./routes/customerFunctionalityRoutes');
const executiveRoute = require('./routes/executiveRoute');
const registrationRoutes = require('./routes/registrationRoutes');
const testdriveRoute = require('./routes/testdriveRoute');
const paymentRoute = require('./routes/paymentRoute');
const { client, collectMysqlMetrics } = require('./routes/customMetrics');
const app = express();

//Initialization
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({ includeMethod: true });

app.use(metricsMiddleware);


app.use((req, res, next) => {
    collectMysqlMetrics();
    next();
});

app.use(express.json());
app.use("/api/vehicle", vehicleRoute);
app.use("/api/customer", customerFunctionalityRoutes);
app.use("/api/executive", executiveRoute);
app.use("/api/registration", registrationRoutes);
app.use("/api/testdrive", testdriveRoute);
app.use("/api/payment", paymentRoute);


app.get('/metrics', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.metrics());
});
//Start the server at 3005 port

app.listen(3005, () => {
    console.log("Server running on port 3005");
});