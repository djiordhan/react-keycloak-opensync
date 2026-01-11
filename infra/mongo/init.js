try {
  rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] });
} catch (e) {
  print("RS already initiated or error: " + e);
}

// Check if collection exists, if not create it to ensure DB is created
let dbName = 'demo';
let dbRef = db.getSiblingDB(dbName);
if (!dbRef.getCollectionNames().includes('tasks')) {
    dbRef.createCollection('tasks');
}
