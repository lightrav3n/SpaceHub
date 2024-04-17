import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  apiObjectId: {
    type: [String],
  },
  avatar: {
    type: String,
    required: true
  }
});

// Middleware to hash the password before saving to the database
userSchema.pre('save', async function (next) {
  // Hash the password only if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log(`Hashed password: ${hashedPassword}`);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log(`Password match for ${this.email}: ${isMatch}`);
  return isMatch;
};

const User = mongoose.model('User', userSchema);

export default User;