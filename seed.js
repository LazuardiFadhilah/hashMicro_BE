/**
 * Seed Script - Populate database with dummy data
 *
 * Usage: node seed.js
 *
 * This script will:
 * 1. Clear all existing data
 * 2. Create users (including your personal account)
 * 3. Create 5 students
 * 4. Create 4 subjects
 * 5. Create grade records linking students to subjects
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ─── Inline schemas (models may not all be created yet) ──────────────────────

const createBaseSchema = require('./src/models/BaseModel');

// User
const { Schema } = mongoose;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true,
              validate: { validator: (v) => EMAIL_REGEX.test(v), message: 'Invalid email' } },
  password: { type: String, required: true },
});
userSchema.add(createBaseSchema());
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Student
const studentSchema = new Schema({
  name:      { type: String, required: true, trim: true },
  studentId: { type: String, required: true, unique: true, trim: true },
  class:     { type: String, required: true, trim: true },
  age:       { type: Number, required: true, min: 1 },
});
studentSchema.add(createBaseSchema());
studentSchema.index({ studentId: 1 }, { unique: true });
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

// Subject
const subjectSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
});
subjectSchema.add(createBaseSchema());
subjectSchema.index({ code: 1 }, { unique: true });
const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

// Grade
const gradeSchema = new Schema({
  studentId:  { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId:  { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  score:      { type: Number, required: true, min: 0, max: 100 },
  attendance: { type: Number, required: true, min: 0, max: 100 },
});
gradeSchema.add(createBaseSchema());
gradeSchema.index({ studentId: 1, subjectId: 1 });
const Grade = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);

// ─── Seed data ────────────────────────────────────────────────────────────────

const USERS = [
  // Your personal account
  { name: 'Lazuardi', email: 'ardi@gmail.com', password: 'password123' },
  // Admin account
  { name: 'Admin', email: 'admin@school.com', password: 'admin123' },
];

const STUDENTS = [
  { name: 'Budi Santoso',    studentId: 'STU001', class: '10A', age: 16 },
  { name: 'Siti Rahayu',     studentId: 'STU002', class: '10A', age: 15 },
  { name: 'Ahmad Fauzi',     studentId: 'STU003', class: '10B', age: 16 },
  { name: 'Dewi Lestari',    studentId: 'STU004', class: '11A', age: 17 },
  { name: 'Rizky Pratama',   studentId: 'STU005', class: '11B', age: 17 },
];

const SUBJECTS = [
  { name: 'Mathematics',        code: 'MTH101', description: 'Basic mathematics including algebra and geometry' },
  { name: 'English Language',   code: 'ENG101', description: 'English reading, writing, and communication skills' },
  { name: 'Physics',            code: 'PHY101', description: 'Fundamentals of physics and mechanics' },
  { name: 'Computer Science',   code: 'CS101',  description: 'Introduction to programming and computer fundamentals' },
];

// Grade data: [studentIndex, subjectIndex, score, attendance]
const GRADE_DATA = [
  // Budi Santoso
  [0, 0, 85, 90],
  [0, 1, 78, 85],
  [0, 2, 72, 75],
  [0, 3, 92, 95],
  // Siti Rahayu
  [1, 0, 91, 100],
  [1, 1, 88, 95],
  [1, 2, 80, 90],
  [1, 3, 76, 80],
  // Ahmad Fauzi
  [2, 0, 65, 70],
  [2, 1, 70, 75],
  [2, 2, 55, 60],
  [2, 3, 82, 85],
  // Dewi Lestari
  [3, 0, 95, 100],
  [3, 1, 90, 95],
  [3, 2, 88, 90],
  [3, 3, 97, 100],
  // Rizky Pratama
  [4, 0, 45, 50],
  [4, 1, 60, 65],
  [4, 2, 40, 55],
  [4, 3, 58, 60],
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Subject.deleteMany({}),
      Grade.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Seed users (hash passwords manually since we're not using the model's pre-save hook)
    console.log('👤 Creating users...');
    const createdUsers = [];
    for (const userData of USERS) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({ ...userData, password: hashedPassword });
      createdUsers.push(user);
      console.log(`   ✓ ${user.name} (${user.email})`);
    }
    console.log();

    // Seed students
    console.log('🎓 Creating students...');
    const createdStudents = await Student.insertMany(STUDENTS);
    createdStudents.forEach((s) => console.log(`   ✓ ${s.name} — ${s.studentId} (${s.class})`));
    console.log();

    // Seed subjects
    console.log('📚 Creating subjects...');
    const createdSubjects = await Subject.insertMany(SUBJECTS);
    createdSubjects.forEach((s) => console.log(`   ✓ ${s.name} (${s.code})`));
    console.log();

    // Seed grades
    console.log('📝 Creating grades...');
    const gradeRecords = GRADE_DATA.map(([si, subi, score, attendance]) => ({
      studentId:  createdStudents[si]._id,
      subjectId:  createdSubjects[subi]._id,
      score,
      attendance,
    }));
    await Grade.insertMany(gradeRecords);
    console.log(`   ✓ ${gradeRecords.length} grade records created\n`);

    // Summary
    console.log('─'.repeat(50));
    console.log('🌱 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Users:    ${createdUsers.length}`);
    console.log(`   Students: ${createdStudents.length}`);
    console.log(`   Subjects: ${createdSubjects.length}`);
    console.log(`   Grades:   ${gradeRecords.length}`);
    console.log('\n🔑 Login credentials:');
    USERS.forEach((u) => console.log(`   ${u.email}  /  ${u.password}`));
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
