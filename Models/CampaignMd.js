import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: [true, "Restaurant ID is required"]
    },
    title: {
        type: String,
        required: [true, "Campaign title is required"]
    },
    questions: [{
        questionText: { type: String, required: [true, "Question text is required"] },
        options: [{ type: String, required: [true, "Options are required"] }],
        correctAnswerIndex: { type: Number, required: [true, "Correct answer index is required"] }
    }],
    minimumCorrectAnswers: {
        type: Number,
        required: [true, "Minimum correct answers required"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
}, {timestamps: true})

const Campaign = mongoose.model("Campaign", campaignSchema)
export default Campaign