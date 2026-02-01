const mongoose = require('mongoose');

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

async function updateOfficersWithTestEmail() {
  try {
    await connectDB();
    
    console.log('📧 Updating all officers with test email address...\n');
    
    // Officer Schema
    const officerSchema = new mongoose.Schema({
      officerId: String,
      name: String,
      email: String,
      rank: String,
      role: String,
      currentStatus: String,
      isActive: Boolean
    }, { timestamps: true });
    
    const Officer = mongoose.models.Officer || mongoose.model('Officer', officerSchema);
    
    // Get all officers
    const officers = await Officer.find({});
    console.log(`📋 Found ${officers.length} officers to update\n`);
    
    const testEmail = 'yunoa315@gmail.com';
    
    for (const officer of officers) {
      // Update officer with test email
      await Officer.updateOne(
        { _id: officer._id },
        { email: testEmail }
      );
      
      console.log(`✅ Updated ${officer.name} (${officer.officerId}) → ${testEmail}`);
    }
    
    console.log(`\n🎉 Successfully updated ${officers.length} officers with test email address!`);
    console.log(`📧 All officers now use: ${testEmail}`);
    
    // Show updated officers
    const updatedOfficers = await Officer.find({}).select('officerId name email role');
    console.log('\n📋 Updated Officers:');
    updatedOfficers.forEach(officer => {
      console.log(`   - ${officer.name} (${officer.officerId}) → ${officer.email} [${officer.role}]`);
    });
    
    console.log('\n🧪 Now you can test email notifications by:');
    console.log('   1. Uploading an Excel file');
    console.log('   2. Checking your Gmail inbox for duty assignment emails');
    console.log('   3. Each officer will receive emails at yunoa315@gmail.com');
    
  } catch (error) {
    console.error('❌ Error updating officers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateOfficersWithTestEmail();
