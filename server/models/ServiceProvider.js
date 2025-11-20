import mongoose from 'mongoose';

const serviceProviderSchema = new mongoose.Schema({
  uuid: {
    type: Number,
    required: true,
    unique: true,
    index: "text"
  },
  fullName: {
    type: String,
    required: true,
    index: "text"
  },
  title: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true,
    enum: ['EASTCONN', 'Generations Health', 'other']
  },
  mobilePhone: {
    type: String,
    required: true,
    index: "text"
  },
  serviceProviderRole: {
    type: String,
    required: true,
    enum: ['Transport Broker', 'Staff', 'Fleet Manager', 'Driver', 'Admin']
  },
  specializations: {
    type: String,
    enum: ['Caseworker', 'Nutritionist', 'Intake'],
    validate: {
      validator: function(specializations) {
        // Only allow specializations if serviceProviderRole is 'Staff'
        if (this.serviceProviderRole !== 'Staff' && specializations) {
          return false;
        }
        return true;
      },
      message: 'Specializations can only be set when serviceProviderRole is Staff'
    }
  },
  faxPhone: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
serviceProviderSchema.index({ uuid: 1 });

export default mongoose.model('ServiceProvider', serviceProviderSchema); 