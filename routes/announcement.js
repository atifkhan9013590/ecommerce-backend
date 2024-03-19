const express = require('express');
const Announcementdb = require('../controller/announcement.js');

const AnnouncementRouter  = express.Router(); 

AnnouncementRouter
.post('/create',Announcementdb.createAnnouncement)
.get('/', Announcementdb.getAllAnnouncements)

exports.AnnouncementRouter=AnnouncementRouter;