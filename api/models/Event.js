const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, default: "" },
        registeredAt: { type: Date, default: Date.now },
    },
    { _id: false } // no separate _id for each attendee (cleaner)
);

const EventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        location: { type: String, trim: true, default: "" },
        geo: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
        description: { type: String, trim: true, default: "" },

        // ✅ Registrations
        attendees: { type: [AttendeeSchema], default: [] },
    },
    { timestamps: true, collection: 'events' }
);

module.exports = mongoose.model("Event", EventSchema);
