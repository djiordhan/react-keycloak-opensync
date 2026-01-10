try {
  rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] });
} catch (e) {
  print("RS already initiated or error: " + e);
}

db.getSiblingDB('admin').createUser({
  user: 'root',
  pwd: 'password',
  roles: ['root']
});

db.getSiblingDB('demo').createUser({
  user: 'powersync',
  pwd: 'powersync',
  roles: [{ role: 'readWrite', db: 'demo' }, { role: 'read', db: 'local' }] // needs local read for oplog
});

db.getSiblingDB('demo').createCollection('tasks');
