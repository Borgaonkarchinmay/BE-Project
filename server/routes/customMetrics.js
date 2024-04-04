const { Gauge, register, Counter } = require('prom-client');
const {client} = require('prom-client');
const db = require("../Database/database");

// Pyament Metrics
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

// MySQL metrics
const mysqlMetrics = {
  mysql_connections: new Gauge({
      name: 'mysql_connections',
      help: 'Number of MySQL connections',
  }),
  mysql_query_execution_time: new Gauge({
      name: 'mysql_query_execution_time',
      help: 'MySQL query execution time in milliseconds',
  }),
  mysql_bytes_received: new Gauge({
      name: 'mysql_bytes_received',
      help: 'Total number of bytes received from all clients',
  }),
  mysql_bytes_sent: new Gauge({
      name: 'mysql_bytes_sent',
      help: 'Total number of bytes sent to all clients',
  }),
  mysql_queries_per_second: new Gauge({
      name: 'mysql_queries_per_second',
      help: 'Number of queries executed per second',
  }),

};

register.registerMetric(mysqlMetrics.mysql_bytes_received);
register.registerMetric(mysqlMetrics.mysql_bytes_sent);
register.registerMetric(mysqlMetrics.mysql_connections);
register.registerMetric(mysqlMetrics.mysql_queries_per_second);
register.registerMetric(mysqlMetrics.mysql_query_execution_time);

function collectMysqlMetrics() {

  // Collect MySQL connection count
  db.query('SELECT @@max_connections AS max_connections, @@max_user_connections AS max_user_connections', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL connection metrics:', error);
      } else {
          const maxConnections = results[0].max_connections;
          const maxUserConnections = results[0].max_user_connections;
          mysqlMetrics.mysql_connections.set(maxConnections);
      }
  });

  // Collect MySQL query execution time
  db.query('SELECT * FROM performance_schema.events_statements_summary_by_digest', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL query execution time metrics:', error);
      } else {
          results.forEach((row) => {
              const digest = row.digest;
              const queryExecutionTime = row.sum_timer_wait / 1000000; // Convert to milliseconds
              //mysqlMetrics.mysql_query_execution_time.labels(digest).set(queryExecutionTime);
              mysqlMetrics.mysql_query_execution_time.set(queryExecutionTime);
          });
      }
  });

  // Collect MySQL connection count
  db.query('SHOW STATUS LIKE "Threads_connected"', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL connection metrics:', error);
      } else {
          const activeConnections = parseInt(results[0].Value);
          mysqlMetrics.mysql_connections.set(activeConnections);
      }
  });

  // Collect MySQL bytes received
  db.query('SHOW GLOBAL STATUS LIKE "Bytes_received"', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL bytes received metrics:', error);
      } else {
          const bytesReceived = parseInt(results[0].Value);
          mysqlMetrics.mysql_bytes_received.set(bytesReceived);
      }
  });

  // Collect MySQL bytes sent
  db.query('SHOW GLOBAL STATUS LIKE "Bytes_sent"', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL bytes sent metrics:', error);
      } else {
          const bytesSent = parseInt(results[0].Value);
          mysqlMetrics.mysql_bytes_sent.set(bytesSent);
      }
  });

  // Collect MySQL queries per second
  db.query('SHOW GLOBAL STATUS LIKE "Queries"', (error, results, fields) => {
      if (error) {
          console.error('Error fetching MySQL queries per second metrics:', error);
      } else {
          const queriesPerSecond = parseInt(results[0].Value);
          mysqlMetrics.mysql_queries_per_second.set(queriesPerSecond);
      }
  });

}

// Export the client and other objects
module.exports = {
  client,
  payment_success_rate_gauge,
  no_of_payments_counter,
  collectMysqlMetrics
};