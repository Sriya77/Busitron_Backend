import mongoose, { Schema } from "mongoose";

const companySettingSchema = new Schema({
	companyName: {
		type: String,
		required: true,
	},
	companyEmail: {
		type: String,
		required: true,
	},
	phoneNumber: {
		type: String,
		required: true,
	},
	website: {
		type: String,
		required: false,
		default: null,
	},
	location: [
		{
			_id:false,
			id: { type: Number, required: true }, 
			country: {
				type: String,
				required: false,
			},
			pinCode: {
				type: String,
				required: false,
			},
			address: {
				type: String,
				required: false,
			},
			city: {
				type: String,
				required: false,
			},
		},
	],
});

export const companySettingModel = mongoose.model(
	"Company_Setting",
	companySettingSchema
);
