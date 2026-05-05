import React, { Component } from 'react';
import './App.css';
import Welcome from './Welcome';

// In production (when served by Express), use relative path.
// In local dev, use the hardcoded localhost:5000.
const API = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// ── Small Toast component ─────────────────────────────────────────
function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// PANEL 1 — Basic CRUD (Items)
// ═══════════════════════════════════════════════════════════════════
class CrudPanel extends Component {
    state = { input: '', editId: null, editVal: '' };

    handleAdd = () => {
        const { input } = this.state;
        if (!input.trim()) return;
        this.props.onCreate(input.trim());
        this.setState({ input: '' });
    };

    startEdit = (item) => this.setState({ editId: item._id, editVal: item.name });

    commitEdit = () => {
        const { editId, editVal } = this.state;
        if (!editVal.trim()) return;
        this.props.onUpdate(editId, editVal.trim());
        this.setState({ editId: null, editVal: '' });
    };

    cancelEdit = () => this.setState({ editId: null, editVal: '' });

    render() {
        const { items, onDelete } = this.props;
        const { input, editId, editVal } = this.state;

        return (
            <div className="panel">
                <div className="panel-header">
                    <div className="panel-header-left">
                        <div className="panel-icon purple">📦</div>
                        <div>
                            <div className="panel-title">CRUD — Items</div>
                            <div className="panel-subtitle">Create · Read · Update · Delete</div>
                        </div>
                    </div>
                    <div className="panel-count">{items.length}</div>
                </div>

                <div className="panel-body">
                    {/* Add new item */}
                    <div>
                        <div className="section-label">Add Item</div>
                        <div className="input-row">
                            <input
                                id="crud-input"
                                type="text"
                                value={input}
                                placeholder="e.g. MacBook Pro…"
                                onChange={e => this.setState({ input: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && this.handleAdd()}
                            />
                            <button className="btn btn-primary" onClick={this.handleAdd}>➕ Add</button>
                        </div>
                    </div>

                    <div className="divider" />

                    {/* Item list */}
                    <div className="section-label">Items ({items.length})</div>
                    <div className="items-list">
                        {items.length === 0 && (
                            <div className="empty-state">
                                <div className="emoji">📭</div>
                                No items yet. Add one above!
                            </div>
                        )}
                        {items.map(item => (
                            <div className="item-row" key={item._id}>
                                {editId === item._id ? (
                                    <>
                                        <div className="edit-inline-row">
                                            <input
                                                type="text"
                                                value={editVal}
                                                onChange={e => this.setState({ editVal: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') this.commitEdit(); if (e.key === 'Escape') this.cancelEdit(); }}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn btn-sm-teal" onClick={this.commitEdit}>✔</button>
                                            <button className="btn btn-danger" onClick={this.cancelEdit}>✕</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="item-name">{item.name}</span>
                                        <div className="item-actions">
                                            <button className="btn btn-edit" onClick={() => this.startEdit(item)}>✏️</button>
                                            <button className="btn btn-danger" onClick={() => onDelete(item._id)}>🗑</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

// ═══════════════════════════════════════════════════════════════════
// PANEL 2 — One-to-Many (Authors → Books)
// ═══════════════════════════════════════════════════════════════════
class OneToManyPanel extends Component {
    state = { authorName: '', bookTitle: '', newBooks: {} };

    handleAddAuthor = () => {
        const { authorName, bookTitle } = this.state;
        if (!authorName.trim()) return;
        this.props.onAddAuthor(authorName.trim(), bookTitle.trim());
        this.setState({ authorName: '', bookTitle: '' });
    };

    handleAddBook = (authorId) => {
        const title = this.state.newBooks[authorId] || '';
        if (!title.trim()) return;
        this.props.onAddBook(authorId, title.trim());
        this.setState(prev => ({ newBooks: { ...prev.newBooks, [authorId]: '' } }));
    };

    render() {
        const { authors, onDeleteAuthor } = this.props;
        const { authorName, bookTitle, newBooks } = this.state;

        return (
            <div className="panel">
                <div className="panel-header">
                    <div className="panel-header-left">
                        <div className="panel-icon teal">📗</div>
                        <div>
                            <div className="panel-title">One-to-Many</div>
                            <div className="panel-subtitle">Author → Books relationship</div>
                        </div>
                    </div>
                    <span className="tag tag-teal">1 : N</span>
                </div>

                <div className="panel-body">
                    {/* New author form */}
                    <div>
                        <div className="section-label">New Author</div>
                        <input
                            type="text"
                            placeholder="Author name…"
                            value={authorName}
                            onChange={e => this.setState({ authorName: e.target.value })}
                            style={{ marginBottom: '8px' }}
                        />
                        <div className="input-row">
                            <input
                                type="text"
                                placeholder="First book title (optional)…"
                                value={bookTitle}
                                onChange={e => this.setState({ bookTitle: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && this.handleAddAuthor()}
                            />
                            <button className="btn btn-teal" onClick={this.handleAddAuthor}>➕</button>
                        </div>
                    </div>

                    <div className="divider" />

                    {/* Authors */}
                    <div className="section-label">Authors ({authors.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px' }}>
                        {authors.length === 0 && (
                            <div className="empty-state">
                                <div className="emoji">✍️</div>
                                No authors yet. Add one above!
                            </div>
                        )}
                        {authors.map(author => (
                            <div className="author-card" key={author._id}>
                                <div className="author-name">
                                    <span>📖 {author.name}</span>
                                    <button className="btn btn-danger" onClick={() => onDeleteAuthor(author._id)}>🗑</button>
                                </div>

                                <div className="books-list">
                                    {author.books.length === 0
                                        ? <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>No books yet</span>
                                        : author.books.map(b => (
                                            <span className="book-chip" key={b._id}>📕 {b.title}</span>
                                        ))
                                    }
                                </div>

                                <div className="add-book-row">
                                    <input
                                        type="text"
                                        placeholder="Add a book…"
                                        value={newBooks[author._id] || ''}
                                        onChange={e => this.setState(prev => ({ newBooks: { ...prev.newBooks, [author._id]: e.target.value } }))}
                                        onKeyDown={e => e.key === 'Enter' && this.handleAddBook(author._id)}
                                    />
                                    <button className="btn btn-sm-teal" onClick={() => this.handleAddBook(author._id)}>+ Book</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

// ═══════════════════════════════════════════════════════════════════
// PANEL 3 — Many-to-Many (Students ↔ Courses)
// ═══════════════════════════════════════════════════════════════════
class ManyToManyPanel extends Component {
    state = { studentName: '', courseTitle: '', selStudent: '', selCourse: '' };

    render() {
        const { students, courses, onAddStudent, onAddCourse, onEnroll, onDeleteStudent, onDeleteCourse } = this.props;
        const { studentName, courseTitle, selStudent, selCourse } = this.state;

        return (
            <div className="panel">
                <div className="panel-header">
                    <div className="panel-header-left">
                        <div className="panel-icon pink">🔄</div>
                        <div>
                            <div className="panel-title">Many-to-Many</div>
                            <div className="panel-subtitle">Students ↔ Courses relationship</div>
                        </div>
                    </div>
                    <span className="tag tag-pink">M : N</span>
                </div>

                <div className="panel-body">
                    {/* Add Student + Course */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <div className="section-label">New Student</div>
                            <div className="input-row">
                                <input type="text" placeholder="Name…" value={studentName}
                                    onChange={e => this.setState({ studentName: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Enter' && studentName.trim()) { onAddStudent(studentName.trim()); this.setState({ studentName: '' }); } }}
                                />
                                <button className="btn btn-teal"
                                    onClick={() => { if (studentName.trim()) { onAddStudent(studentName.trim()); this.setState({ studentName: '' }); } }}>
                                    ➕
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="section-label">New Course</div>
                            <div className="input-row">
                                <input type="text" placeholder="Title…" value={courseTitle}
                                    onChange={e => this.setState({ courseTitle: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Enter' && courseTitle.trim()) { onAddCourse(courseTitle.trim()); this.setState({ courseTitle: '' }); } }}
                                />
                                <button className="btn btn-primary"
                                    onClick={() => { if (courseTitle.trim()) { onAddCourse(courseTitle.trim()); this.setState({ courseTitle: '' }); } }}>
                                    ➕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Enroll form */}
                    <div className="enroll-section">
                        <h4>🔗 Enroll Student in Course</h4>
                        <div className="enroll-selects">
                            <select value={selStudent} onChange={e => this.setState({ selStudent: e.target.value })}>
                                <option value="">Select student…</option>
                                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                            <select value={selCourse} onChange={e => this.setState({ selCourse: e.target.value })}>
                                <option value="">Select course…</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-teal btn-full"
                            onClick={() => {
                                if (selStudent && selCourse) {
                                    onEnroll(selStudent, selCourse);
                                    this.setState({ selStudent: '', selCourse: '' });
                                }
                            }}>
                            ⚡ Enroll
                        </button>
                    </div>

                    <div className="divider" />

                    {/* Students */}
                    <div className="section-label">Students ({students.length})</div>
                    <div className="entity-grid" style={{ marginBottom: '12px' }}>
                        {students.length === 0 && (
                            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                <div className="emoji">🎓</div>No students yet
                            </div>
                        )}
                        {students.map(s => (
                            <div className="student-card" key={s._id}>
                                <div className="entity-name">
                                    <span>🙋 {s.name}</span>
                                    <button className="btn btn-danger" onClick={() => onDeleteStudent(s._id)}>✕</button>
                                </div>
                                <div className="enrollments">
                                    {s.courses.length === 0
                                        ? <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>No courses</span>
                                        : s.courses.map(c => (
                                            <span className="enroll-chip-teal" key={c._id}>{c.title}</span>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Courses */}
                    <div className="section-label">Courses ({courses.length})</div>
                    <div className="entity-grid">
                        {courses.length === 0 && (
                            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                <div className="emoji">📚</div>No courses yet
                            </div>
                        )}
                        {courses.map(c => (
                            <div className="course-card" key={c._id}>
                                <div className="entity-name">
                                    <span>📚 {c.title}</span>
                                    <button className="btn btn-danger" onClick={() => onDeleteCourse(c._id)}>✕</button>
                                </div>
                                <div className="enrollments">
                                    {c.students.length === 0
                                        ? <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>No students</span>
                                        : c.students.map(s => (
                                            <span className="enroll-chip-pink" key={s._id}>{s.name}</span>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
class App extends Component {
    state = {
        items: [], authors: [], students: [], courses: [],
        toasts: [], toastId: 0,
        seeding: false,
    };

    componentDidMount() { this.loadAll(); }

    loadAll = () => {
        Promise.all([
            fetch(`${API}/items`).then(r => r.json()),
            fetch(`${API}/api/authors`).then(r => r.json()),
            fetch(`${API}/api/students`).then(r => r.json()),
            fetch(`${API}/api/courses`).then(r => r.json()),
        ]).then(([items, authors, students, courses]) => {
            this.setState({
                items: Array.isArray(items) ? items : [],
                authors: Array.isArray(authors) ? authors : [],
                students: Array.isArray(students) ? students : [],
                courses: Array.isArray(courses) ? courses : [],
            });
        }).catch(() => this.toast('❌ Could not connect to server', 'error'));
    };

    toast = (msg, type = 'success') => {
        const id = this.state.toastId + 1;
        this.setState(prev => ({ toasts: [...prev.toasts, { id, msg, type }], toastId: id }));
        setTimeout(() => this.setState(prev => ({ toasts: prev.toasts.filter(t => t.id !== id) })), 3200);
    };

    // ── Items ────────────────────────────────────────────────────
    handleCreate = async (name) => {
        const r = await fetch(`${API}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        const item = await r.json();
        this.setState(p => ({ items: [item, ...p.items] }));
        this.toast('✅ Item added');
    };

    handleUpdate = async (id, name) => {
        const r = await fetch(`${API}/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        const updated = await r.json();
        this.setState(p => ({ items: p.items.map(i => i._id === id ? updated : i) }));
        this.toast('✏️ Item updated');
    };

    handleDelete = async (id) => {
        await fetch(`${API}/items/${id}`, { method: 'DELETE' });
        this.setState(p => ({ items: p.items.filter(i => i._id !== id) }));
        this.toast('🗑 Item deleted');
    };

    // ── Authors ──────────────────────────────────────────────────
    handleAddAuthor = async (authorName, bookTitle) => {
        const r = await fetch(`${API}/api/authors`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorName, bookTitle })
        });
        const author = await r.json();
        this.setState(p => ({ authors: [...p.authors, author] }));
        this.toast('📖 Author added');
    };

    handleAddBook = async (authorId, bookTitle) => {
        const r = await fetch(`${API}/api/authors/${authorId}/books`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookTitle })
        });
        const updated = await r.json();
        this.setState(p => ({ authors: p.authors.map(a => a._id === authorId ? updated : a) }));
        this.toast('📕 Book added');
    };

    handleDeleteAuthor = async (id) => {
        await fetch(`${API}/api/authors/${id}`, { method: 'DELETE' });
        this.setState(p => ({ authors: p.authors.filter(a => a._id !== id) }));
        this.toast('🗑 Author deleted');
    };

    // ── Students / Courses ───────────────────────────────────────
    handleAddStudent = async (name) => {
        const r = await fetch(`${API}/api/students`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName: name })
        });
        const s = await r.json();
        this.setState(p => ({ students: [...p.students, s] }));
        this.toast('🎓 Student added');
    };

    handleAddCourse = async (title) => {
        const r = await fetch(`${API}/api/courses`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseTitle: title })
        });
        const c = await r.json();
        this.setState(p => ({ courses: [...p.courses, c] }));
        this.toast('📚 Course added');
    };

    handleEnroll = async (studentId, courseId) => {
        const r = await fetch(`${API}/api/enroll`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, courseId })
        });
        const { student, course } = await r.json();
        this.setState(p => ({
            students: p.students.map(s => s._id === studentId ? student : s),
            courses:  p.courses.map(c => c._id === courseId  ? course  : c),
        }));
        this.toast('⚡ Enrolled successfully');
    };

    handleDeleteStudent = async (id) => {
        await fetch(`${API}/api/students/${id}`, { method: 'DELETE' });
        this.setState(p => ({
            students: p.students.filter(s => s._id !== id),
            courses: p.courses.map(c => ({ ...c, students: c.students.filter(s => s._id !== id) }))
        }));
        this.toast('🗑 Student removed');
    };

    handleDeleteCourse = async (id) => {
        await fetch(`${API}/api/courses/${id}`, { method: 'DELETE' });
        this.setState(p => ({
            courses: p.courses.filter(c => c._id !== id),
            students: p.students.map(s => ({ ...s, courses: s.courses.filter(c => c._id !== id) }))
        }));
        this.toast('🗑 Course removed');
    };

    // ── Seed ─────────────────────────────────────────────────────
    handleSeed = async () => {
        this.setState({ seeding: true });
        const r = await fetch(`${API}/api/seed`, { method: 'POST' });
        const d = await r.json();
        await this.loadAll();
        this.setState({ seeding: false });
        this.toast(d.message || '🎉 Seeded!');
    };

    render() {
        const { items, authors, students, courses, toasts, seeding } = this.state;

        return (
            <div className="app">
                {/* ── Header ── */}
                <header className="header">
                    <div className="header-left">
                        <div className="header-icon">🍃</div>
                        <div>
                            <h1>MongoDB CRUD Dashboard</h1>
                            <p>Assignment 27 · One-to-Many &amp; Many-to-Many Relationships</p>
                        </div>
                    </div>
                    <Welcome />
                </header>

                {/* ── Seed Banner ── */}
                <div className="seed-banner">
                    <div className="seed-banner-text">
                        <h3>🚀 Quick-Start Demo</h3>
                        <p>Click to populate the database with sample authors, books, students and courses</p>
                    </div>
                    <button className="btn btn-seed" onClick={this.handleSeed} disabled={seeding}>
                        {seeding ? '⏳ Seeding…' : '🌱 Seed Database'}
                    </button>
                </div>

                {/* ── Three-panel Grid ── */}
                <div className="main-grid">
                    <CrudPanel
                        items={items}
                        onCreate={this.handleCreate}
                        onUpdate={this.handleUpdate}
                        onDelete={this.handleDelete}
                    />
                    <OneToManyPanel
                        authors={authors}
                        onAddAuthor={this.handleAddAuthor}
                        onAddBook={this.handleAddBook}
                        onDeleteAuthor={this.handleDeleteAuthor}
                    />
                    <ManyToManyPanel
                        students={students}
                        courses={courses}
                        onAddStudent={this.handleAddStudent}
                        onAddCourse={this.handleAddCourse}
                        onEnroll={this.handleEnroll}
                        onDeleteStudent={this.handleDeleteStudent}
                        onDeleteCourse={this.handleDeleteCourse}
                    />
                </div>

                <ToastContainer toasts={toasts} />
            </div>
        );
    }
}

export default App;