const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mario:mario1234@cluster0.clljubv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Officer Schema
const officerSchema = new mongoose.Schema({
  officerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rank: { type: String, required: true },
  badgeNumber: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, enum: ['officer', 'supervisor'], default: 'officer' },
  currentStatus: { type: String, enum: ['On-Duty', 'Off-Duty'], default: 'Off-Duty' },
  isActive: { type: Boolean, default: true },
  currentLocation: {
    lat: { type: Number },
    lon: { type: Number }
  }
}, {
  timestamps: true
});

const Officer = mongoose.models.Officer || mongoose.model('Officer', officerSchema);

async function createTestAccounts() {
  try {
    await connectDB();
    
    console.log('🧪 Creating test accounts x1 and x2...\n');
    
    // Create x1 account
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const officer1 = new Officer({
      officerId: 'x1',
      name: 'Test Officer X1',
      rank: 'Constable',
      badgeNumber: 'X001',
      department: 'Patrol Division',
      role: 'officer',
      currentStatus: 'Off-Duty',
      isActive: true,
      currentLocation: {
        lat: 15.4989,
        lon: 73.8278
      }
    });
    
    // Create x2 account
    const hashedPassword2 = await bcrypt.hash('password123', 10);
    const officer2 = new Officer({
      officerId: 'x2',
      name: 'Test Officer X2',
      rank: 'Head Constable',
      badgeNumber: 'X002',
      department: 'Traffic Division',
      role: 'officer',
      currentStatus: 'Off-Duty',
      isActive: true,
      currentLocation: {
        lat: 15.2733,
        lon: 73.9589
      }
    });
    
    // Save both officers
    await officer1.save();
    console.log('✅ Created officer x1:', officer1.name);
    
    await officer2.save();
    console.log('✅ Created officer x2:', officer2.name);
    
    // Create login credentials (we need to add password field to officers or create separate auth collection)
    // For now, let's create a simple auth collection
    const authSchema = new mongoose.Schema({
      officerId: { type: String, required: true, unique: true },
      password: { type: String, required: true }
    }, {
      timestamps: true
    });
    
    const Auth = mongoose.models.Auth || mongoose.model('Auth', authSchema);
    
    // Create auth records
    await Auth.findOneAndUpdate(
      { officerId: 'x1' },
      { officerId: 'x1', password: hashedPassword1 },
      { upsert: true, new: true }
    );
    console.log('✅ Created auth for x1');
    
    await Auth.findOneAndUpdate(
      { officerId: 'x2' },
      { officerId: 'x2', password: hashedPassword2 },
      { upsert: true, new: true }
    );
    console.log('✅ Created auth for x2');
    
    console.log('\n🎉 Test accounts created successfully!');
    console.log('📋 Account Details:');
    console.log('   x1 - Test Officer X1 (Constable) - Password: password123');
    console.log('   x2 - Test Officer X2 (Head Constable) - Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestAccounts();
