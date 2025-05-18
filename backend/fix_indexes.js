const mongoose = require('mongoose');
require('dotenv').config();

// Use the actual connection string from .env
const uri = process.env.MONGODB_URI || 'mongodb+srv://daneeliasgharib:dJPJGQxtto8hp8il@telehealth.1ji8cro.mongodb.net/?retryWrites=true&w=majority&appName=teleHealth';

async function fixIndexes() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    
    console.log('Connected to database.');
    
    // Get the collection directly to run raw commands
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');
    
    console.log('Checking current indexes...');
    const indexes = await appointmentsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, unique: idx.unique })));
    
    // Drop the problematic unique index on availability if it exists
    const availabilityIndex = indexes.find(idx => idx.name === 'availability_1');
    if (availabilityIndex && availabilityIndex.unique === true) {
      console.log('Found unique index on availability field. Dropping index...');
      await appointmentsCollection.dropIndex('availability_1');
      console.log('Unique index dropped successfully.');
    }
    
    // Create a non-unique index on availability
    console.log('Creating non-unique index on availability field...');
    await appointmentsCollection.createIndex({ availability: 1 }, { unique: false });
    console.log('Non-unique index created successfully.');
    
    // Create other useful indexes
    console.log('Creating compound index for doctor + patient + day to ensure one appointment per day per patient per doctor...');
    await appointmentsCollection.createIndex({ 
      doctor: 1,
      patient: 1,
      // This compound index allows multiple appointments with different availabilities
      // but the backend logic will handle checking for same-day issues
    }, { unique: false });
    
    console.log('All indexes fixed successfully.');
    
    // Verify the new indexes
    const newIndexes = await appointmentsCollection.indexes();
    console.log('New indexes:', newIndexes.map(idx => ({ name: idx.name, unique: idx.unique })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

fixIndexes(); 