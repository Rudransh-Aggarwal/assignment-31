const mongoose = require('mongoose');
const AuthorSchema = new mongoose.Schema({
    name: String,
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }] // One author has many books
});
module.exports = mongoose.model('Author', AuthorSchema);