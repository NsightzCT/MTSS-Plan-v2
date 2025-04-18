// Intervention strategies extracted from evidence-based practices
const interventionStrategies = [
  {
    name: "2X10 RELATIONSHIP BUILDING",
    description: "Spend two minutes for 10 consecutive school days developing a positive relationship with a student. Provide positive attention through encouragement and recognition of the student's strengths and interests.",
    tier: "2",
    grades: "PK-12",
    bestFor: "Behavior, Life Skills"
  },
  {
    name: "4 AT THE DOOR + 1 MORE",
    description: "Greet students intentionally at the door using protocols such as \"Eye to Eye\" and \"Name to Name.\"",
    tier: "1, 2",
    grades: "PK-12",
    bestFor: "Life Skills"
  },
  {
    name: "BEAR BELLY BREATHING",
    description: "A simple activity for children to help introduce them to mindful breathing. This mindful breathing exercise calms the mind, relaxes the body, and increases student engagement.",
    tier: "1, 2",
    grades: "PK-5",
    bestFor: "Life Skills"
  },
  {
    name: "BEHAVIOR-SPECIFIC PRAISE",
    description: "Behavior-specific praise is a type of praise that acknowledges students' appropriate behavior and provides them with the specifics on what appropriate behavior they are engaging in. When teachers provide immediate, frequent, and specific praise, students are able to identify what behaviors are positive and then they are more likely to engage in those behaviors in the future.",
    tier: "1",
    grades: "PK-12",
    bestFor: "Behavior"
  },
  {
    name: "CHECK IN/CHECK OUT (CICO)",
    description: "At the beginning of each day, meet with the student to review the goals you've set together. Confirm the specific goal for that day and offer an incentive for the student to reach the goal. Observe the student and provide feedback throughout the day. Then, at the end of the day, talk about whether they were able to meet the goal. Provide recognition and the reward if they did, and provide encouragement and feedback if they did not.",
    tier: "2, 3",
    grades: "K-12",
    bestFor: "Behavior"
  },
  {
    name: "GRAPHIC ORGANIZER",
    description: "Graphic organizers are designed to visually represent thinking and to visually connect key ideas. Graphic organizers can serve many purposes for students, from helping them take notes in class, to recording different perspectives during a group discussion, to pre-writing, problem-solving, pre-reading, or synthesizing their thinking at the end of a lesson.",
    tier: "1, 2, 3",
    grades: "3-12",
    bestFor: "ELA, Math, Other Academics"
  },
  {
    name: "HOME VISIT",
    description: "Arrange a home visit with the goal of building a relationship with the child's family. Seek to understand the family's hopes and aspirations for their child, and ask the family how you can best support them and their child.",
    tier: "1, 2, 3",
    grades: "PK-12",
    bestFor: "Attendance, Behavior, Life Skills, ELA, Math"
  },
  {
    name: "LUNCH BUNCH",
    description: "Bring together a group of students to meet with the school counselor or social worker during lunchtime with a specific goal in mind. For example, a lunch bunch may be focused on developing a specific Life skill or on teaching conflict resolution skills.",
    tier: "2",
    grades: "K-12",
    bestFor: "Behavior, Life Skills"
  },
  {
    name: "NUDGE LETTER",
    description: "Send a letter home to the student's family or caregiver with information about their child's absences. Communicate the importance of attendance, include the child's attendance data, and compare the child's records with other students' attendance.",
    tier: "2, 3",
    grades: "PK-12",
    bestFor: "Attendance"
  },
  {
    name: "PEER TUTORING",
    description: "Peer Tutoring allows students to become teachers. A student follows teacher-created materials as they explain a concept to a classmate. Roles reverse between students halfway through the activity so all students act as tutors at some point during the activity.",
    tier: "2",
    grades: "4-12",
    bestFor: "Academics"
  },
  {
    name: "ROSE, BUD, THORN",
    description: "In this reflective exercise, students identify positive moments and areas where they need support.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills"
  },
  {
    name: "SELF-MONITORING",
    description: "Self-monitoring strategies are individualized plans used to increase independence and awareness in academic, behavioral, and social areas. The student measures and records his or her own behavior and then compares that to behavior recorded by the teacher or an academic exemplar.",
    tier: "1, 2, 3",
    grades: "K-12",
    bestFor: "Behavior, Life Skills"
  },
  {
    name: "SIGHT WORD PRACTICE",
    description: "Sight words are words that should be memorized to increase a student's reading accuracy and rate. Provide additional instruction, drills, and exercises to promote students' ability to recognize common sight words.",
    tier: "1, 2, 3",
    grades: "K-5",
    bestFor: "ELA"
  },
  {
    name: "TWO WORD CHECK-IN",
    description: "Ask students to choose two words to describe how they are feeling. This is a simple yet powerful exercise that enhances emotional awareness, promotes authenticity, and builds community.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills"
  },
  {
    name: "WOOP",
    description: "WOOP stands for Wish, Outcome, Obstacle, and Plan. WOOP helps you to explore what your wish is as well as the barriers that hold you back from fulfilling this desire.",
    tier: "1, 2",
    grades: "K-12",
    bestFor: "Life Skills"
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