import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength:8,
      select :false,
      
      // No minlength, no select: false, no pre-save hook
    },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
