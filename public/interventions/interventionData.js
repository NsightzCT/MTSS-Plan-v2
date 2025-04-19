// Intervention strategies extracted from evidence-based practices
const interventionStrategies = [
  {
    name: "2X10 RELATIONSHIP BUILDING",
    description: "Spend two minutes for 10 consecutive school days developing a positive relationship with a student. Provide positive attention through encouragement and recognition of the student's strengths and interests.",
    tier: "2",
    grades: "PK-12",
    bestFor: "Behavior, Life Skills",
    implementation: {
      steps: [
        "Choose a consistent time each day for the 2-minute conversation",
        "Focus on the student's interests and strengths",
        "Use open-ended questions to encourage dialogue",
        "Maintain a positive and encouraging tone",
        "Document the student's responses and progress"
      ],
      materials: [
        "Student interest inventory form",
        "Progress tracking sheet",
        "Timer or watch"
      ],
      tips: [
        "Be consistent with timing and duration",
        "Avoid discussing academic or behavioral concerns during these sessions",
        "Keep the conversation student-centered",
        "Use active listening techniques",
        "Document any changes in student behavior or engagement"
      ],
      duration: "10 consecutive school days, 2 minutes per day",
      frequency: "Daily",
      progressMonitoring: "Track student engagement, behavior changes, and relationship development"
    }
  },
  {
    name: "4 AT THE DOOR + 1 MORE",
    description: "Greet students intentionally at the door using protocols such as \"Eye to Eye\" and \"Name to Name.\"",
    tier: "1, 2",
    grades: "PK-12",
    bestFor: "Life Skills",
    implementation: {
      steps: [
        "Stand at the classroom door before students arrive",
        "Make eye contact with each student",
        "Greet each student by name",
        "Use a positive statement or question",
        "Add one additional positive interaction during the day"
      ],
      materials: [
        "Student name list",
        "Positive greeting prompts",
        "Progress tracking sheet"
      ],
      tips: [
        "Practice student names to ensure correct pronunciation",
        "Vary the type of greeting to keep it fresh",
        "Be consistent with timing and location",
        "Maintain a positive and welcoming demeanor",
        "Document any changes in student engagement"
      ],
      duration: "Ongoing",
      frequency: "Daily",
      progressMonitoring: "Track student responses, engagement levels, and classroom climate"
    }
  },
  {
    name: "BEAR BELLY BREATHING",
    description: "A simple activity for children to help introduce them to mindful breathing. This mindful breathing exercise calms the mind, relaxes the body, and increases student engagement.",
    tier: "1, 2",
    grades: "PK-5",
    bestFor: "Life Skills",
    implementation: {
      steps: [
        "Introduce the concept of belly breathing",
        "Demonstrate placing hands on belly",
        "Guide students through slow, deep breaths",
        "Use visual cues or props",
        "Practice regularly as a class"
      ],
      materials: [
        "Visual breathing guide",
        "Stuffed animal (optional)",
        "Timer",
        "Calming music (optional)"
      ],
      tips: [
        "Start with short sessions (1-2 minutes)",
        "Use consistent verbal cues",
        "Model the behavior yourself",
        "Create a calm environment",
        "Be patient with student learning"
      ],
      duration: "2-5 minutes per session",
      frequency: "2-3 times daily or as needed",
      progressMonitoring: "Track student engagement, self-regulation, and classroom behavior"
    }
  },
  {
    name: "BEHAVIOR-SPECIFIC PRAISE",
    description: "Behavior-specific praise is a type of praise that acknowledges students' appropriate behavior and provides them with the specifics on what appropriate behavior they are engaging in. When teachers provide immediate, frequent, and specific praise, students are able to identify what behaviors are positive and then they are more likely to engage in those behaviors in the future.",
    tier: "1",
    grades: "PK-12",
    bestFor: "Behavior",
    implementation: {
      steps: [
        "Identify specific behaviors to reinforce",
        "Provide immediate praise when behavior occurs",
        "Be specific about what behavior you're praising",
        "Use a positive and enthusiastic tone",
        "Maintain consistent implementation"
      ],
      materials: [
        "Behavior tracking sheet",
        "Praise prompt cards",
        "Timer or interval tracker"
      ],
      tips: [
        "Aim for a 4:1 ratio of praise to correction",
        "Vary the type of praise used",
        "Be genuine and specific",
        "Include the student's name",
        "Document patterns of behavior change"
      ],
      duration: "Ongoing",
      frequency: "Throughout the day",
      progressMonitoring: "Track frequency of praise, student responses, and behavior changes"
    }
  },
  {
    name: "CHECK IN/CHECK OUT (CICO)",
    description: "At the beginning of each day, meet with the student to review the goals you've set together. Confirm the specific goal for that day and offer an incentive for the student to reach the goal. Observe the student and provide feedback throughout the day. Then, at the end of the day, talk about whether they were able to meet the goal. Provide recognition and the reward if they did, and provide encouragement and feedback if they did not.",
    tier: "2, 3",
    grades: "K-12",
    bestFor: "Behavior",
    implementation: {
      steps: [
        "Set up morning check-in routine",
        "Establish clear, measurable goals",
        "Create daily tracking sheet",
        "Schedule regular check-ins",
        "Provide consistent feedback"
      ],
      materials: [
        "Daily point sheet",
        "Goal setting worksheet",
        "Reward menu",
        "Progress tracking system"
      ],
      tips: [
        "Keep goals simple and achievable",
        "Be consistent with check-in/check-out times",
        "Use positive reinforcement",
        "Involve the student in goal setting",
        "Maintain clear communication with all staff"
      ],
      duration: "Daily",
      frequency: "Morning check-in, end of day check-out",
      progressMonitoring: "Track daily points, goal achievement, and behavior patterns"
    }
  },
  {
    name: "GRAPHIC ORGANIZER",
    description: "Graphic organizers are designed to visually represent thinking and to visually connect key ideas. Graphic organizers can serve many purposes for students, from helping them take notes in class, to recording different perspectives during a group discussion, to pre-writing, problem-solving, pre-reading, or synthesizing their thinking at the end of a lesson.",
    tier: "1, 2, 3",
    grades: "3-12",
    bestFor: "ELA, Math, Other Academics",
    implementation: {
      steps: [
        "Select appropriate organizer type",
        "Model how to use the organizer",
        "Provide guided practice",
        "Allow independent practice",
        "Review and reflect on completed organizers"
      ],
      materials: [
        "Various graphic organizer templates",
        "Student work samples",
        "Modeling examples",
        "Rubric for assessment"
      ],
      tips: [
        "Choose organizers that match the learning objective",
        "Start with simple organizers and increase complexity",
        "Provide clear instructions and examples",
        "Allow for student choice when appropriate",
        "Use organizers consistently across subjects"
      ],
      duration: "Varies by task",
      frequency: "As needed for instruction",
      progressMonitoring: "Track student understanding, organization skills, and content mastery"
    }
  },
  {
    name: "HOME VISIT",
    description: "Arrange a home visit with the goal of building a relationship with the child's family. Seek to understand the family's hopes and aspirations for their child, and ask the family how you can best support them and their child.",
    tier: "1, 2, 3",
    grades: "PK-12",
    bestFor: "Attendance, Behavior, Life Skills, ELA, Math",
    implementation: {
      steps: [
        "Schedule visit with family",
        "Prepare questions and materials",
        "Conduct visit in family's home",
        "Document observations and discussions",
        "Follow up with action plan"
      ],
      materials: [
        "Home visit protocol",
        "Family questionnaire",
        "Documentation forms",
        "Resource materials"
      ],
      tips: [
        "Be respectful of family time and space",
        "Focus on building relationships",
        "Listen more than you speak",
        "Be culturally sensitive",
        "Maintain confidentiality"
      ],
      duration: "30-60 minutes per visit",
      frequency: "As needed, typically 1-2 times per year",
      progressMonitoring: "Track family engagement, student progress, and relationship development"
    }
  },
  {
    name: "LUNCH BUNCH",
    description: "Bring together a group of students to meet with the school counselor or social worker during lunchtime with a specific goal in mind. For example, a lunch bunch may be focused on developing a specific Life skill or on teaching conflict resolution skills.",
    tier: "2",
    grades: "K-12",
    bestFor: "Behavior, Life Skills",
    implementation: {
      steps: [
        "Identify target students and goals",
        "Schedule regular lunch bunch sessions",
        "Prepare activities and materials",
        "Facilitate group discussions",
        "Document progress and observations"
      ],
      materials: [
        "Activity plans",
        "Discussion prompts",
        "Progress tracking sheets",
        "Group rules and expectations"
      ],
      tips: [
        "Keep groups small (4-6 students)",
        "Be consistent with scheduling",
        "Create a safe, welcoming environment",
        "Use engaging activities",
        "Maintain confidentiality"
      ],
      duration: "20-30 minutes per session",
      frequency: "1-2 times per week",
      progressMonitoring: "Track social skills development, group participation, and behavior changes"
    }
  },
  {
    name: "NUDGE LETTER",
    description: "Send a letter home to the student's family or caregiver with information about their child's absences. Communicate the importance of attendance, include the child's attendance data, and compare the child's records with other students' attendance.",
    tier: "2, 3",
    grades: "PK-12",
    bestFor: "Attendance",
    implementation: {
      steps: [
        "Collect attendance data",
        "Prepare personalized letter",
        "Include specific attendance information",
        "Add supportive resources",
        "Follow up with family"
      ],
      materials: [
        "Letter template",
        "Attendance data",
        "Resource list",
        "Follow-up plan"
      ],
      tips: [
        "Use a positive, supportive tone",
        "Be specific about attendance data",
        "Offer assistance and resources",
        "Follow up with additional support",
        "Document communication"
      ],
      duration: "Ongoing",
      frequency: "As needed based on attendance patterns",
      progressMonitoring: "Track attendance changes, family responses, and intervention effectiveness"
    }
  },
  {
    name: "PEER TUTORING",
    description: "Peer Tutoring allows students to become teachers. A student follows teacher-created materials as they explain a concept to a classmate. Roles reverse between students halfway through the activity so all students act as tutors at some point during the activity.",
    tier: "2",
    grades: "4-12",
    bestFor: "Academics",
    implementation: {
      steps: [
        "Select appropriate student pairs",
        "Train students in tutoring techniques",
        "Provide structured materials",
        "Monitor tutoring sessions",
        "Evaluate effectiveness"
      ],
      materials: [
        "Tutor training materials",
        "Structured activities",
        "Progress tracking sheets",
        "Evaluation rubrics"
      ],
      tips: [
        "Match students carefully",
        "Provide clear instructions",
        "Monitor sessions regularly",
        "Rotate pairs periodically",
        "Celebrate successes"
      ],
      duration: "20-30 minutes per session",
      frequency: "2-3 times per week",
      progressMonitoring: "Track academic progress, engagement levels, and skill development"
    }
  },
  {
    name: "ROSE, BUD, THORN",
    description: "In this reflective exercise, students identify positive moments and areas where they need support.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills",
    implementation: {
      steps: [
        "Introduce the concept",
        "Model the reflection process",
        "Guide students through practice",
        "Facilitate group sharing",
        "Document insights and patterns"
      ],
      materials: [
        "Reflection worksheet",
        "Visual aids",
        "Discussion prompts",
        "Progress tracking system"
      ],
      tips: [
        "Create a safe sharing environment",
        "Be consistent with implementation",
        "Allow for various response formats",
        "Respect student privacy",
        "Use insights to inform instruction"
      ],
      duration: "10-15 minutes per session",
      frequency: "Weekly or as needed",
      progressMonitoring: "Track student reflections, emotional awareness, and growth"
    }
  },
  {
    name: "SELF-MONITORING",
    description: "Self-monitoring strategies are individualized plans used to increase independence and awareness in academic, behavioral, and social areas. The student measures and records his or her own behavior and then compares that to behavior recorded by the teacher or an academic exemplar.",
    tier: "1, 2, 3",
    grades: "K-12",
    bestFor: "Behavior, Life Skills",
    implementation: {
      steps: [
        "Identify target behaviors",
        "Create monitoring tools",
        "Train student in self-monitoring",
        "Implement monitoring system",
        "Review and adjust as needed"
      ],
      materials: [
        "Self-monitoring checklist",
        "Progress tracking sheet",
        "Visual aids",
        "Reward system"
      ],
      tips: [
        "Start with simple behaviors",
        "Provide clear examples",
        "Be consistent with implementation",
        "Gradually increase independence",
        "Celebrate progress"
      ],
      duration: "Ongoing",
      frequency: "Daily or as needed",
      progressMonitoring: "Track student accuracy, behavior changes, and independence"
    }
  },
  {
    name: "SIGHT WORD PRACTICE",
    description: "Sight words are words that should be memorized to increase a student's reading accuracy and rate. Provide additional instruction, drills, and exercises to promote students' ability to recognize common sight words.",
    tier: "1, 2, 3",
    grades: "K-5",
    bestFor: "ELA",
    implementation: {
      steps: [
        "Assess current sight word knowledge",
        "Create individualized word lists",
        "Implement practice activities",
        "Monitor progress",
        "Adjust instruction as needed"
      ],
      materials: [
        "Sight word lists",
        "Flashcards",
        "Practice games",
        "Progress tracking sheets"
      ],
      tips: [
        "Use multi-sensory approaches",
        "Keep practice sessions short",
        "Make it fun and engaging",
        "Provide immediate feedback",
        "Celebrate progress"
      ],
      duration: "10-15 minutes per session",
      frequency: "Daily",
      progressMonitoring: "Track word recognition, reading fluency, and confidence"
    }
  },
  {
    name: "TWO WORD CHECK-IN",
    description: "Ask students to choose two words to describe how they are feeling. This is a simple yet powerful exercise that enhances emotional awareness, promotes authenticity, and builds community.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills",
    implementation: {
      steps: [
        "Introduce the check-in process",
        "Model appropriate responses",
        "Establish routine timing",
        "Facilitate sharing",
        "Document patterns and concerns"
      ],
      materials: [
        "Emotion word list",
        "Response cards",
        "Tracking sheet",
        "Visual aids"
      ],
      tips: [
        "Be consistent with timing",
        "Respect student privacy",
        "Model vulnerability",
        "Use age-appropriate language",
        "Follow up on concerning responses"
      ],
      duration: "5-10 minutes",
      frequency: "Daily or as needed",
      progressMonitoring: "Track emotional awareness, engagement, and social-emotional growth"
    }
  },
  {
    name: "WOOP",
    description: "WOOP stands for Wish, Outcome, Obstacle, and Plan. WOOP helps you to explore what your wish is as well as the barriers that hold you back from fulfilling this desire.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills",
    implementation: {
      steps: [
        "Introduce WOOP framework",
        "Guide students through wish identification",
        "Help visualize positive outcomes",
        "Identify potential obstacles",
        "Create concrete action plans"
      ],
      materials: [
        "WOOP worksheet",
        "Visual examples",
        "Progress tracking sheet",
        "Goal setting template"
      ],
      tips: [
        "Start with simple wishes",
        "Be specific with outcomes",
        "Help identify realistic obstacles",
        "Create detailed action plans",
        "Follow up on progress"
      ],
      duration: "15-20 minutes per session",
      frequency: "Weekly or as needed",
      progressMonitoring: "Track goal setting, problem-solving skills, and achievement"
    }
  }
];

// Categorized intervention data
const interventionData = {
  domains: {
    academic: {
      name: "Academic",
      description: "Interventions focused on improving academic skills and performance",
      interventions: interventionStrategies.filter(strategy => {
        const bestFor = strategy.bestFor.toLowerCase();
        return bestFor.includes('ela') || bestFor.includes('math') || bestFor.includes('academics');
      })
    },
    behavior: {
      name: "Behavior",
      description: "Interventions focused on improving student behavior and social interactions",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.bestFor.toLowerCase().includes('behavior');
      })
    },
    attendance: {
      name: "Attendance",
      description: "Interventions focused on improving student attendance and reducing absences",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.bestFor.toLowerCase().includes('attendance');
      })
    },
    lifeSkills: {
      name: "Life Skills",
      description: "Interventions focused on developing social-emotional skills and self-management",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.bestFor.toLowerCase().includes('life skills');
      })
    }
  },
  tiers: {
    tier1: {
      name: "Tier 1",
      description: "Universal supports for all students",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.tier.split(', ').includes('1') || strategy.tier.includes('1');
      })
    },
    tier2: {
      name: "Tier 2",
      description: "Targeted interventions for students needing additional support",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.tier.split(', ').includes('2') || strategy.tier.includes('2');
      })
    },
    tier3: {
      name: "Tier 3",
      description: "Intensive interventions for students with significant needs",
      interventions: interventionStrategies.filter(strategy => {
        return strategy.tier.split(', ').includes('3') || strategy.tier.includes('3');
      })
    }
  }
};

// Sample student intervention plan template
const sampleInterventionPlan = {
  studentInfo: {
    name: "[Student Name]",
    grade: "[Grade Level]",
    teacher: "[Teacher Name]",
    startDate: "[Start Date]",
    endDate: "[End Date]"
  },
  areaOfConcern: "[Academic/Behavioral/Attendance/Life Skills]",
  tier: "[Tier 2/Tier 3]",
  baselineData: "[Describe current performance/behavior]",
  goal: "[Specific, Measurable, Achievable, Relevant, Time-bound goal]",
  interventions: [
    {
      name: "[Intervention Name]",
      description: "[Brief description]",
      frequency: "[Daily/Weekly/etc.]",
      duration: "[Length of each session]",
      responsible: "[Staff member responsible]"
    }
  ],
  progressMonitoring: {
    method: "[Assessment/Observation/Data Collection Method]",
    frequency: "[Daily/Weekly/Bi-weekly/Monthly]",
    nextReviewDate: "[Date for team to review progress]"
  }
};

// Sample progress monitoring template
const progressMonitoringTemplate = {
  individual: {
    dataPoints: [
      { date: "[Date]", intervention: "[Yes/No]", score: "[Score/Rating]", onTrack: "[Yes/No/Progressing]" }
    ],
    notes: "[Observations and additional information]"
  },
  system: {
    metrics: [
      "Percentage of students in each tier",
      "Intervention enrollment by demographics",
      "Percentage of intervention plans on track",
      "Number of students exiting interventions",
      "Percentage of students meeting goals",
      "Most frequently used interventions",
      "Most successful interventions"
    ],
    recommendedFrequency: "Review system-level data monthly with MTSS team"
  }
};

// Export the data for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    interventionStrategies,
    interventionData,
    sampleInterventionPlan,
    progressMonitoringTemplate
  };
}