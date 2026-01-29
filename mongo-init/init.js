// MongoDB initialization script
// This creates the application user and database

db = db.getSiblingDB('preventivi');

// Create collections
db.createCollection('clients');
db.createCollection('quotes');
db.createCollection('templates');
db.createCollection('counters');

// Initialize quote number counter
db.counters.insertOne({
  _id: 'quote_number',
  seq: 0
});

// Create indexes
db.clients.createIndex({ company_name: 1 });
db.quotes.createIndex({ quote_number: -1 });
db.quotes.createIndex({ client_id: 1 });
db.quotes.createIndex({ status: 1 });
db.templates.createIndex({ name: 1 }, { unique: true });

print('Database initialized successfully');
