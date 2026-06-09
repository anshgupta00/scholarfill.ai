export const MOCK_USER = {
  id: "u-001",
  name: "Ansh Gupta",
  email: "ansh@sayapatri.com",
  avatar: "AG",
};

export const MOCK_CV = {
  id: "cv-001",
  file_name: "Ansh_Gupta_CV.pdf",
  updated_at: "2025-06-01T10:00:00Z",
  structured_data: {
    personal: {
      full_name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      phone: "+977-9800000000",
      city: "Biratnagar",
      country: "Nepal",
      linkedin: "linkedin.com/in/anshgupta",
      github: "github.com/anshgupta",
    },
    summary: "Computer Engineering graduate and Founder of Sayapatri Group Pvt. Ltd., building AI-powered software solutions in Nepal.",
    education: [
      {
        degree: "Bachelor of Engineering",
        field: "Computer Engineering",
        institution: "Tribhuvan University",
        location: "Nepal",
        start_year: "2020",
        end_year: "2024",
        gpa: "3.8",
      },
    ],
    skills: {
      technical: ["Python", "React", "FastAPI", "PostgreSQL", "YOLOv8", "Docker"],
      soft: ["Leadership", "Communication", "Problem Solving"],
      languages: ["English", "Nepali", "Hindi"],
      tools: ["VS Code", "Figma", "Postman", "Git"],
    },
    experience: [
      {
        title: "Founder & CEO",
        organization: "Sayapatri Group Pvt. Ltd.",
        location: "Biratnagar, Nepal",
        start_date: "2022-01",
        end_date: "Present",
        description: "Leading a software development and IT consultancy firm delivering AI solutions, web/mobile development, and training programs.",
      },
    ],
    awards: [
      { title: "Best Innovation Award", issuer: "Abhiyan 2025", year: "2025" },
    ],
  },
};

export const MOCK_APPLICATIONS = [
  {
    id: "app-001",
    form_url: "https://docs.google.com/forms/d/e/example1/viewform",
    form_title: "Madhesh Province Youth Summit 2026",
    status: "submitted",
    created_at: "2025-06-05T09:00:00Z",
    submitted_at: "2025-06-05T09:12:00Z",
    form_fields: [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "tel", required: false },
      { name: "institution", label: "Institution/Organization", type: "text", required: true },
      { name: "motivation", label: "Why do you want to attend?", type: "textarea", required: true },
      { name: "skills", label: "Relevant Skills", type: "text", required: false },
    ],
    filled_data: {
      full_name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      phone: "+977-9800000000",
      institution: "Sayapatri Group Pvt. Ltd.",
      motivation: "As a tech entrepreneur from Koshi Province, I am deeply committed to digital civic engagement. I want to contribute insights on AI-powered governance tools we are developing at Sayapatri Group.",
      skills: "Python, React, AI/ML, Leadership, Public Speaking",
    },
  },
  {
    id: "app-002",
    form_url: "https://forms.example.com/scholarship2026",
    form_title: "Nepal Youth Innovation Scholarship 2026",
    status: "reviewed",
    created_at: "2025-06-04T14:00:00Z",
    submitted_at: null,
    form_fields: [
      { name: "name", label: "Applicant Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "age", label: "Age", type: "text", required: true },
      { name: "project", label: "Describe your innovation project", type: "textarea", required: true },
      { name: "impact", label: "What impact has it created?", type: "textarea", required: true },
    ],
    filled_data: {
      name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      age: "23",
      project: "AI Interview Platform — a real-time proctoring system using YOLOv8, MediaPipe, and DeepFace to ensure integrity in remote hiring processes.",
      impact: "Deployed at multiple institutions in Nepal, reducing hiring fraud by 60% and enabling fair remote recruitment across the country.",
    },
  },
  {
    id: "app-003",
    form_url: "https://docs.google.com/forms/d/e/example3/viewform",
    form_title: "Digital Koshi Leadership Program",
    status: "pending",
    created_at: "2025-06-06T11:00:00Z",
    submitted_at: null,
    form_fields: [],
    filled_data: {},
  },
];
