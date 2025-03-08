import mongoose from "mongoose";
const { Schema, model } = mongoose;
const documentSchema = new Schema({
  url: { type: String },
  name: { type: String },
  size: { type: Number },
});

const messageSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    media: [
      {
        type: { type: String, enum: ["image", "video"] },
        url: { type: String },
      },
    ],
    document: documentSchema,
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["Media", "Text", "Document"] },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);

export default Message;
