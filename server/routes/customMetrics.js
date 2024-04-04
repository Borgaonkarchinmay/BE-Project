const { Gauge, register, Counter } = require('prom-client');
const {client} = require('prom-client');

// Define your metrics
const payment_success_rate_gauge = new Gauge({
  name: 'payment_success_rate_gauge',
  help: 'Number of successful razorpay payments'
});

const no_of_payments_counter = new Counter({
  name: 'no_of_payments_counter',
  help: 'Counts number of payments verification api calls handeled by the server'
});

register.registerMetric(payment_success_rate_gauge);
register.registerMetric(no_of_payments_counter);

// Export the client and other objects
module.exports = {
  client,
  payment_success_rate_gauge,
  no_of_payments_counter
};