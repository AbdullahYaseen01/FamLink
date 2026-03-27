import mongoose, { mongo } from "mongoose";

const { Schema } = mongoose;

const locationSchema = new Schema({
  type: {
    type: Schema.Types.String,
    enum: ["Point"], // GeoJSON type must be "Point"
    required: false,
  },
  coordinates: {
    type: [Number], // Array of two numbers: [longitude, latitude]
    required: false,
  },
  format_location: {
    type: Schema.Types.String,
    required: false,
  },
});

const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users", // Reference the User model
    required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "bookings", // Reference the User model
  },
  rating: {
    type: Number,
    min: 1, // Minimum rating value
    max: 5, // Maximum rating value
    required: true,
  },
  msg: {
    type: Schema.Types.String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
  },
  email: {
    type: Schema.Types.String,
    required: true,
    unique: true, // Ensures uniqueness of email
  },
  sheetId: {
    type: Schema.Types.String,
  },
  hasSubmittedSheetResponse: {
    type: Schema.Types.Boolean,
    default: false,
  },
  location: {
    type: locationSchema,
  },
  password: {
    type: Schema.Types.String,
  },
  registeredVia: {
    type: Schema.Types.String,
  },
  dob: {
    type: Schema.Types.Date,
    required: false,
  },
  phoneNo: {
    type: Schema.Types.String,
  },
  zipCode: {
    type: Schema.Types.String,
  },
  services: {
    type: [Schema.Types.String],
  },
  noOfChildren: {
    type: Schema.Types.Mixed,
  },
  favourite: {
    type: [Schema.Types.Mixed],
  },
  type: {
    type: Schema.Types.String,
    enum: ["Parents", "Nanny", "Admin"],
    required: true, // or false, depending on whether it's optional
  },
  ActiveAt: {
    type: Date,
    required: true,
  },
  online: {
    type: Schema.Types.Boolean,
    default: false,
  },
  verified: {
    emailVer: {
      type: Schema.Types.Boolean,
      default: false,
    },
    phoneVer: {
      type: Schema.Types.Boolean,
      default: false,
    },
    nationalIDVer: {
      type: Schema.Types.String,
      enum: ["false", "underprocess", "true"],
      default: "false",
    },
  },
  imageUrl: {
    type: Schema.Types.String,
  },
  additionalInfo: {
    type: [Schema.Types.Mixed],
  },
  age: {
    type: Schema.Types.String,
  },
  gender: {
    type: Schema.Types.String,
  },
  otp: {
    type: Schema.Types.String,
  },
  otpExpiry: {
    type: Schema.Types.Date,
  },
  notifications: {
    email: {
      newMessage: { type: Schema.Types.Boolean, default: true },
      backgroundCheck: { type: Schema.Types.Boolean, default: true },
      safetyNoti: { type: Schema.Types.Boolean, default: true },
      newRecoLists: { type: Schema.Types.Boolean, default: true },
      tipsAndTricks: { type: Schema.Types.Boolean, default: true },
      ref: { type: Schema.Types.Boolean, default: true },
      disAccInfo: { type: Schema.Types.Boolean, default: true },
      newSubInArea: { type: Schema.Types.Boolean, default: true },
      // payrolls: { type: Schema.Types.Boolean, default: true }
    },
    sms: {
      type: Schema.Types.Boolean,
      default: false,
    },
  },
  stripeId: {
    type: Schema.Types.String,
  },
  subscriptionId: String,
  subscriptionStatus: String,
  premium: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Schema.Types.String,
    enum: ["Active", "Block"],
    default: "Active",
    required: true, // or false, depending on whether it's optional
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  aboutMe: {
    type: Schema.Types.String,
  },
  reviews: [reviewSchema],
  // completedBookings: [
  //     {
  //         type: Schema.Types.ObjectId,
  //         ref: 'Booking'
  //     }
  // ],
  // canceledBookings: [
  //     {
  //         type: Schema.Types.ObjectId,
  //         ref: 'Booking'
  //     }
  // ]
});

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("users", userSchema);
export default User;
