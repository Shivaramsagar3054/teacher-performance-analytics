export const courses = [
  { id: 1, title: 'Computer Science Engineering', description: 'Build the future with technology and innovation.', category: 'Engineering', icon: 'Computer', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800' },
  { id: 2, title: 'Mechanical Engineering', description: 'Design, innovate and create real-world solutions.', category: 'Engineering', icon: 'Settings', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
  { id: 3, title: 'Business Administration', description: 'Develop leadership and management skills.', category: 'Business', icon: 'Briefcase', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800' },
  { id: 4, title: 'Law Programs', description: 'Justice, ethics and excellence in law.', category: 'Law', icon: 'Scale', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800' },
  { id: 5, title: 'Life Sciences & Biotech', description: 'Explore, research and innovate for life.', category: 'Life Sciences', icon: 'Microscope', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800' },
];

export const users = [
  { id: 1, email: 'admin@college.edu', role: 'admin', is_active: true },
  { id: 2, email: 'arvind.mehta@brightfuture.edu', role: 'teacher', is_active: true },
  { id: 3, email: 'student@college.edu', role: 'student', is_active: true },
];

const defaultProfDetails = {
  // New Schema Fields
  user_id: 2,
  first_name: 'Priya',
  last_name: 'Sharma',
  position: 'Professor',
  years_of_experience: 12,
  phone_number: '+91 98765 43210',
  biography: 'A distinguished faculty member with extensive teaching and research experience. Passionate about innovative teaching methods and mentoring the next generation.',
  profile_image_path: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
  
  // Legacy Fields (kept for backward compatibility during transition)
  title: 'Professor',
  fullBio: 'A distinguished faculty member with extensive teaching and research experience.',
  email: 'faculty@brightfuture.edu',
  phone: '+91 98765 43210',
  location: 'Faculty Block',
  experience: '10+ Years of Experience',
  image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
  
  // Array structures that will be split into separate tables eventually
  educationList: [
    { id: 1, degree: 'Ph.D.', field_of_study: 'Electronics', institution_name: 'IIT', university_name: 'IIT', start_year: '2005', end_year: '2010', grade: 'A' }
  ],
  education: 'Ph.D.',
  researchInterests: ['Core Subject Area', 'Advanced Research', 'Applied Sciences'],
  officeHours: 'Mon - Fri: 10:00 AM - 12:00 PM',
  quote: '"Education is not the learning of facts, but the training of the mind to think."',
  completedCourses: [],
  currentCourses: []
};

export const professors = [
  { 
    id: 1, 
    user_id: 2,
    name: 'Dr. Arvind Mehta', // Legacy
    first_name: 'Arvind',
    last_name: 'Mehta',
    department: 'Computer Science', 
    category: 'Computer Science', 
    position: 'Professor',
    title: 'Professor, Department of Computer Science', // Legacy
    years_of_experience: 15,
    experience: '15+ Years of Experience', // Legacy
    biography: 'Expert in Artificial Intelligence and Machine Learning with over 15 years of teaching and research experience. Passionate about innovative teaching methods and mentoring the next generation of tech leaders.',
    fullBio: 'Expert in Artificial Intelligence and Machine Learning with over 15 years of teaching and research experience. Passionate about innovative teaching methods and mentoring the next generation of tech leaders.',
    description: 'Expert in Artificial Intelligence and Machine Learning.', 
    profile_image_path: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800', // Legacy
    email: 'arvind.mehta@brightfuture.edu',
    phone_number: '+91 98765 43210',
    phone: '+91 98765 43210',
    location: 'Room 305, Computer Science Block',
    educationList: [
      { id: 1, degree: 'Ph.D.', field_of_study: 'Computer Science', institution_name: 'IIT Delhi', university_name: 'IIT Delhi', start_year: '2000', end_year: '2005', grade: 'A+' },
      { id: 2, degree: 'M.Tech', field_of_study: 'Computer Science', institution_name: 'NIT Trichy', university_name: 'NIT Trichy', start_year: '1998', end_year: '2000', grade: 'A' }
    ],
    education: 'Ph.D. in Computer Science, IIT Delhi',
    researchInterests: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Data Science', 'Natural Language Processing'],
    officeHours: 'Mon - Fri: 10:00 AM - 12:00 PM\n(or by appointment)',
    quote: '"Teaching is not just about sharing knowledge, it\'s about inspiring minds and shaping the future."',
    completedCourses: [
      { id: 'c1', name: 'Introduction to Artificial Intelligence', code: 'CS101', course_full_name: 'Introduction to Artificial Intelligence', exam_type: 'Final', completion_date: '2023-12-15', slot: 'A1', s_grades: 10, a_grades: 20, b_grades: 30, c_grades: 15, d_grades: 5, e_grades: 2, pass_percentage: 85, members: 120, passed: 102, failed: 18, percentage: 85, icon: 'Brain', color: 'text-blue-600', bg: 'bg-blue-100' },
      { id: 'c2', name: 'Data Structures and Algorithms', code: 'CS201', course_full_name: 'Data Structures and Algorithms', exam_type: 'Midterm', completion_date: '2023-10-10', slot: 'B2', s_grades: 5, a_grades: 25, b_grades: 40, c_grades: 10, d_grades: 2, e_grades: 0, pass_percentage: 83, members: 98, passed: 82, failed: 16, percentage: 83, icon: 'Database', color: 'text-purple-600', bg: 'bg-purple-100' },
    ],
    currentCourses: [
      { id: 't1', name: 'Advanced Machine Learning', code: 'CS501', desc: 'Advanced topics in machine learning algorithms, model evaluation, and real-world applications.', students: 78, schedule: 'Mon, Wed, Fri\n11:00 AM - 12:30 PM', room: 'Lab 2, CS Block', icon: 'Code', color: 'text-blue-600', bg: 'bg-blue-100' },
    ]
  },
  { id: 2, name: 'Dr. Priya Sharma', first_name: 'Priya', last_name: 'Sharma', department: 'Electronics Engineering', category: 'Engineering', description: 'Specializes in VLSI Design and Embedded Systems.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800', profile_image_path: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800', ...defaultProfDetails },
  { id: 3, name: 'Dr. Rahul Nair', first_name: 'Rahul', last_name: 'Nair', department: 'Mechanical Engineering', category: 'Engineering', description: 'Researches in Robotics and Automation.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800', profile_image_path: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800', ...defaultProfDetails },
];

export const analyticsData = {
  totalStudents: 1250,
  activeCourses: 24,
  averageRating: 4.7,
  attendance: [
    { name: 'Week 1', present: 95 },
    { name: 'Week 2', present: 92 },
    { name: 'Week 3', present: 96 },
    { name: 'Week 4', present: 98 },
  ],
  performance: [
    { name: 'A Grade', value: 400 },
    { name: 'B Grade', value: 300 },
    { name: 'C Grade', value: 200 },
    { name: 'D Grade', value: 100 },
  ],
};
