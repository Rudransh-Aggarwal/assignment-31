const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// MONGO_URI is injected by Docker Compose; falls back to localhost for local dev
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/assignment27';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected to', MONGO_URI))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ═══════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════

const Item = mongoose.model('Item', new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true }));

// ONE-TO-MANY: One Author → Many Books
const Author = mongoose.model('Author', new mongoose.Schema({
    name: String,
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
}));

const Book = mongoose.model('Book', new mongoose.Schema({
    title: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' }
}));

// MANY-TO-MANY: Students ↔ Courses (bidirectional refs)
const Student = mongoose.model('Student', new mongoose.Schema({
    name: String,
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
}));

const Course = mongoose.model('Course', new mongoose.Schema({
    title: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}));

// ═══════════════════════════════════════════════════════════════════
// BASIC CRUD — Items
// ═══════════════════════════════════════════════════════════════════

// READ all
app.get('/items', async (req, res) => {
    try { res.json(await Item.find().sort({ createdAt: -1 })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE
app.post('/items', async (req, res) => {
    try {
        const item = await Item.create({ name: req.body.name });
        res.status(201).json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// UPDATE
app.put('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name },
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
app.delete('/items/:id', async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// ONE-TO-MANY — Authors & Books
// ═══════════════════════════════════════════════════════════════════

// GET all authors with their books populated
app.get('/api/authors', async (req, res) => {
    try { res.json(await Author.find().populate('books')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE a new author + optionally attach a book
app.post('/api/authors', async (req, res) => {
    try {
        const { authorName, bookTitle } = req.body;
        const author = await Author.create({ name: authorName });
        if (bookTitle) {
            const book = await Book.create({ title: bookTitle, author: author._id });
            author.books.push(book._id);
            await author.save();
        }
        res.status(201).json(await Author.findById(author._id).populate('books'));
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// ADD a book to an existing author
app.post('/api/authors/:id/books', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) return res.status(404).json({ error: 'Author not found' });
        const book = await Book.create({ title: req.body.bookTitle, author: author._id });
        author.books.push(book._id);
        await author.save();
        res.status(201).json(await Author.findById(author._id).populate('books'));
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE an author (and their books)
app.delete('/api/authors/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) return res.status(404).json({ error: 'Author not found' });
        await Book.deleteMany({ _id: { $in: author.books } });
        await Author.findByIdAndDelete(req.params.id);
        res.json({ message: 'Author and books deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// MANY-TO-MANY — Students & Courses
// ═══════════════════════════════════════════════════════════════════

// GET all students with courses populated
app.get('/api/students', async (req, res) => {
    try { res.json(await Student.find().populate('courses')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all courses with students populated
app.get('/api/courses', async (req, res) => {
    try { res.json(await Course.find().populate('students')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE a student
app.post('/api/students', async (req, res) => {
    try {
        const student = await Student.create({ name: req.body.studentName });
        res.status(201).json(student);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// CREATE a course
app.post('/api/courses', async (req, res) => {
    try {
        const course = await Course.create({ title: req.body.courseTitle });
        res.status(201).json(course);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// ENROLL a student in a course (bidirectional link)
app.post('/api/enroll', async (req, res) => {
    try {
        const { studentId, courseId } = req.body;
        const student = await Student.findById(studentId);
        const course = await Course.findById(courseId);
        if (!student || !course) return res.status(404).json({ error: 'Student or Course not found' });

        // Avoid duplicates
        if (!student.courses.includes(courseId)) { student.courses.push(courseId); await student.save(); }
        if (!course.students.includes(studentId)) { course.students.push(studentId); await course.save(); }

        res.json({
            student: await Student.findById(studentId).populate('courses'),
            course: await Course.findById(courseId).populate('students')
        });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE a student
app.delete('/api/students/:id', async (req, res) => {
    try {
        await Course.updateMany({ students: req.params.id }, { $pull: { students: req.params.id } });
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE a course
app.delete('/api/courses/:id', async (req, res) => {
    try {
        await Student.updateMany({ courses: req.params.id }, { $pull: { courses: req.params.id } });
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════════
app.post('/api/seed', async (req, res) => {
    try {
        await Item.deleteMany({});
        await Author.deleteMany({});
        await Book.deleteMany({});
        await Student.deleteMany({});
        await Course.deleteMany({});

        // Items
        await Item.insertMany([{ name: 'MacBook Pro' }, { name: 'Dell XPS 15' }, { name: 'iPad Air' }]);

        // One-to-Many
        const a1 = await Author.create({ name: 'George R.R. Martin' });
        const b1 = await Book.create({ title: 'A Game of Thrones', author: a1._id });
        const b2 = await Book.create({ title: 'A Clash of Kings', author: a1._id });
        a1.books.push(b1._id, b2._id);
        await a1.save();

        const a2 = await Author.create({ name: 'J.K. Rowling' });
        const b3 = await Book.create({ title: "Philosopher's Stone", author: a2._id });
        const b4 = await Book.create({ title: 'Chamber of Secrets', author: a2._id });
        a2.books.push(b3._id, b4._id);
        await a2.save();

        // Many-to-Many
        const s1 = await Student.create({ name: 'Alice' });
        const s2 = await Student.create({ name: 'Bob' });
        const s3 = await Student.create({ name: 'Carol' });
        const c1 = await Course.create({ title: 'Web Development' });
        const c2 = await Course.create({ title: 'Database Systems' });
        const c3 = await Course.create({ title: 'Machine Learning' });

        s1.courses.push(c1._id, c2._id); s2.courses.push(c1._id, c3._id); s3.courses.push(c2._id, c3._id);
        c1.students.push(s1._id, s2._id); c2.students.push(s1._id, s3._id); c3.students.push(s2._id, s3._id);
        await Promise.all([s1.save(), s2.save(), s3.save(), c1.save(), c2.save(), c3.save()]);

        res.json({ message: '🎉 Database seeded successfully!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// SERVE FRONTEND (React)
// ═══════════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the React app (SPA fallback)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));