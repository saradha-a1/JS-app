import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://saradhacharu1228_db_user:mUZbk4wJtrS00w3C@cluster0ab.2vteuce.mongodb.net/js_packers_erp?retryWrites=true&w=majority';

const UserSchema = new mongoose.Schema({
  username: String, email: String, password: String,
  full_name: String, role: String, status: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin user already exists');
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin',
    email: 'admin@jspackers.com',
    password,
    full_name: 'Administrator',
    role: 'admin',
    status: 'active',
  });

  console.log('✅ Admin user created!');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Change the password after first login!');

  await mongoose.disconnect();
}

seed().catch(console.error);
