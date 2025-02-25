import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: false,
        },
        avatar: {
            type: String,
            required: false,
            defaultAvatar:
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["Admin", "Employee"],
            required: true,
            default: "Employee",
        },
        refreshToken: {
            type: String,
            default: null,
        },
        accessToken: {
            type: String,
            default: null,
        },
        otp: {
            type: String,
            default: null,
            expiredAt: Date.now() + 10 * 60,
        },
        isValid: {
            type: Boolean,
            default: false,
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        designation: {
            type: String,
            required: true,
        },
        employeeId: {
            type: String,
            required: true,
            unique: true,
        },
        message: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: false,
        },

        maritalStatus: {
            type: String,
            enum: ["Single", "Married", "Divorced", "Widowed"],
            required: false,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcryptjs.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcryptjs.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
