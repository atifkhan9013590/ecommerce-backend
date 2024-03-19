const model = require("../model/announcement.js");
const Announcement = model;

exports.createAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const announcement = new Announcement({ message });
    await announcement.save();
    res.status(201).json({ message: 'Announcement created successfully' });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort('-createdAt');
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
