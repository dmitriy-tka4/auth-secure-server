import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  }
});

export default mongoose.model('user-refresh-tokens', schema);
