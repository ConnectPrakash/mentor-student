
const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');


const app = express();
app.use(express.json());
app.use(cors())


mongoose.connect('mongodb://localhost:27017/mentor_student_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const mentorSchema = new mongoose.Schema({
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});
const Mentor = mongoose.model('Mentor', mentorSchema);


const studentSchema = new mongoose.Schema({
  name: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', default: null }
});
const Student = mongoose.model('Student', studentSchema);


app.post('/mentors', async (req, res) => {
  try {
    const mentor = await Mentor.create(req.body);
    res.status(201).json(mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/students', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/assign/:mentorId/:studentId', async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(req.params.mentorId, {
      $push: { students: req.params.studentId }
    });
    const student = await Student.findByIdAndUpdate(req.params.studentId, {
      mentor: req.params.mentorId
    });
    res.status(200).json({ mentor, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/change-mentor/:studentId/:newMentorId', async (req, res) => {
  try {
    const oldMentor = await Mentor.findOneAndUpdate({ students: req.params.studentId }, {
      $pull: { students: req.params.studentId }
    });
    const newMentor = await Mentor.findByIdAndUpdate(req.params.newMentorId, {
      $push: { students: req.params.studentId }
    });
    const student = await Student.findByIdAndUpdate(req.params.studentId, {
      mentor: req.params.newMentorId
    });
    res.status(200).json({ oldMentor, newMentor, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to show all students for a particular mentor
app.get('/mentor-students/:mentorId', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId).populate('students');
    res.status(200).json(mentor.students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to show the previously assigned mentor for a particular student
app.get('/student-mentor/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('mentor');
    res.status(200).json(student.mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
