const mongoose = require('mongoose');
const CourseSchema = new mongoose.Schema({
    title: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Many courses have many students
});
module.exports = mongoose.model('Course', CourseSchema);