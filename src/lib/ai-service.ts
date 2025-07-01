import { supabase } from './supabase';

// Types for AI interactions
export interface AIPerformanceData {
  userId: string;
  subjects: Array<{
    id: string;
    name: string;
    averageScore: number;
    recentScores: number[];
    improvementRate: number;
    studyTime: number;
  }>;
  overallAverage: number;
  recentMarks: Array<{
    id: string;
    score: number;
    percentage: number;
    testType: string;
    testName: string;
    date: string;
    subjectName: string;
  }>;
  studyPatterns: {
    totalStudyTime: number;
    weeklyStudyHours: number;
    preferredStudyTimes: string[];
    consistencyScore: number;
    currentStreak: number;
  };
  goals: Array<{
    id: string;
    title: string;
    targetScore: number;
    currentScore: number;
    progress: number;
    subjectName?: string;
  }>;
}

export interface AIGeneratedInsight {
  insightType: string;
  title: string;
  content: string;
  confidenceScore: number;
  priority: string;
  subjectId?: string;
}

export interface AIGeneratedSuggestion {
  title: string;
  description: string;
  type: string;
  priority: string;
  category: string;
  resourceUrl?: string;
  estimatedTime?: string;
  subjectId?: string;
  confidenceScore: number;
}

// AI Service class for AI-related operations
export class AIService {
  // Prepare student data for AI analysis
  async prepareStudentData(userId: string): Promise<AIPerformanceData | null> {
    try {
      // Get user's subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, color, current_grade, target_grade, study_priority, total_study_time')
        .eq('user_id', userId);

      if (subjectsError) throw subjectsError;

      // Get all marks
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select(`
          id, score, max_score, percentage, test_type, test_name, date, 
          subjects(id, name, color)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (marksError) throw marksError;

      // Get study sessions
      const { data: studyData, error: studyError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (studyError) throw studyError;

      // Get goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select(`
          id, title, target_score, current_score, progress, status, priority, 
          subjects(id, name)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (goalsError) throw goalsError;

      // Get user stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('total_study_time, current_streak, longest_streak, preferred_study_time')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Process and transform data for AI analysis
      const subjects = subjectsData.map(subject => {
        const subjectMarks = marksData.filter(mark => mark.subjects?.id === subject.id);
        const scores = subjectMarks.map(mark => mark.percentage);
        const subjectStudyTime = studyData
          .filter(session => session.subject_id === subject.id)
          .reduce((total, session) => total + (session.duration_minutes || 0), 0);

        // Calculate improvement rate based on recent scores vs earlier scores
        let improvementRate = 0;
        if (scores.length >= 4) {
          const recentAvg = scores.slice(0, Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / 
                           Math.ceil(scores.length / 2);
          const earlierAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / 
                            Math.floor(scores.length / 2);
          improvementRate = recentAvg - earlierAvg;
        }

        return {
          id: subject.id,
          name: subject.name,
          averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          recentScores: scores.slice(0, 5),
          improvementRate,
          studyTime: subjectStudyTime
        };
      });

      // Calculate overall average
      const allScores = marksData.map(mark => mark.percentage);
      const overallAverage = allScores.length 
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
        : 0;

      // Format recent marks
      const recentMarks = marksData.slice(0, 10).map(mark => ({
        id: mark.id,
        score: mark.score,
        percentage: mark.percentage,
        testType: mark.test_type,
        testName: mark.test_name,
        date: mark.date,
        subjectName: mark.subjects?.name || 'Unknown'
      }));

      // Analyze study patterns
      const studyTimes = studyData.map(session => {
        const startTime = new Date(session.start_time);
        return startTime.getHours();
      });

      const preferredStudyTimes = this.analyzePreferredStudyTimes(studyTimes);
      
      // Calculate weekly study hours
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyStudyMinutes = studyData
        .filter(session => new Date(session.start_time) >= oneWeekAgo)
        .reduce((total, session) => total + (session.duration_minutes || 0), 0);

      const weeklyStudyHours = weeklyStudyMinutes / 60;

      // Calculate consistency score (0-100)
      const consistencyScore = this.calculateConsistencyScore(studyData);

      // Format goals data
      const goals = goalsData.map(goal => ({
        id: goal.id,
        title: goal.title,
        targetScore: goal.target_score,
        currentScore: goal.current_score,
        progress: goal.progress,
        subjectName: goal.subjects?.name
      }));

      return {
        userId,
        subjects,
        overallAverage,
        recentMarks,
        studyPatterns: {
          totalStudyTime: userData?.total_study_time || 0,
          weeklyStudyHours,
          preferredStudyTimes,
          consistencyScore,
          currentStreak: userData?.current_streak || 0
        },
        goals
      };
    } catch (error) {
      console.error("Error preparing student data for AI analysis:", error);
      return null;
    }
  }

  // Generate AI insights based on student performance
  async generateInsights(studentData: AIPerformanceData): Promise<AIGeneratedInsight[]> {
    try {
      // In a real implementation, this would call an external AI API
      // For now, we'll use a simple rule-based approach to generate insights
      
      const insights: AIGeneratedInsight[] = [];
      
      // Overall performance insight
      if (studentData.overallAverage > 0) {
        const overallInsight = this.generateOverallPerformanceInsight(studentData);
        insights.push(overallInsight);
      }
      
      // Subject-specific insights
      studentData.subjects.forEach(subject => {
        if (subject.recentScores.length > 0) {
          const subjectInsight = this.generateSubjectInsight(subject, studentData);
          insights.push(subjectInsight);
        }
      });
      
      // Study pattern insights
      const studyInsight = this.generateStudyPatternInsight(studentData.studyPatterns);
      insights.push(studyInsight);
      
      // Goal progress insights
      if (studentData.goals.length > 0) {
        const goalInsight = this.generateGoalInsight(studentData.goals);
        insights.push(goalInsight);
      }
      
      return insights;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return [];
    }
  }

  // Generate suggestions for improvement
  async generateSuggestions(studentData: AIPerformanceData): Promise<AIGeneratedSuggestion[]> {
    try {
      const suggestions: AIGeneratedSuggestion[] = [];
      
      // Overall improvement suggestions
      suggestions.push(this.generateOverallSuggestion(studentData));
      
      // Subject-specific suggestions
      studentData.subjects.forEach(subject => {
        if (subject.recentScores.length > 0) {
          const subjectSuggestion = this.generateSubjectSuggestion(subject);
          suggestions.push(subjectSuggestion);
        }
      });
      
      // Study pattern suggestions
      suggestions.push(this.generateStudyPatternSuggestion(studentData.studyPatterns));
      
      // Goal-related suggestions
      if (studentData.goals.length > 0) {
        suggestions.push(this.generateGoalSuggestion(studentData.goals));
      }
      
      return suggestions;
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      return [];
    }
  }

  // Save generated insights to the database
  async saveInsights(userId: string, insights: AIGeneratedInsight[]): Promise<boolean> {
    try {
      const insightsToInsert = insights.map(insight => ({
        user_id: userId,
        insight_type: insight.insightType,
        title: insight.title,
        content: insight.content,
        confidence_score: insight.confidenceScore,
        priority: insight.priority,
        is_read: false,
        subject_id: insight.subjectId || null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('ai_insights')
        .insert(insightsToInsert);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving AI insights:", error);
      return false;
    }
  }

  // Save generated suggestions to the database
  async saveSuggestions(userId: string, suggestions: AIGeneratedSuggestion[]): Promise<boolean> {
    try {
      const suggestionsToInsert = suggestions.map(suggestion => ({
        user_id: userId,
        title: suggestion.title,
        description: suggestion.description,
        type: suggestion.type,
        priority: suggestion.priority,
        status: 'active',
        category: suggestion.category,
        resource_url: suggestion.resourceUrl || null,
        estimated_time: suggestion.estimatedTime || null,
        subject_id: suggestion.subjectId || null,
        ai_generated: true,
        confidence_score: suggestion.confidenceScore,
        interaction_count: 0,
        effectiveness_rating: 0
      }));

      const { error } = await supabase
        .from('suggestions')
        .insert(suggestionsToInsert);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving AI suggestions:", error);
      return false;
    }
  }

  // Helper method to analyze preferred study times
  private analyzePreferredStudyTimes(studyHours: number[]): string[] {
    // Count occurrences of each hour
    const hourCounts: Record<string, number> = {};
    
    studyHours.forEach(hour => {
      const timeRange = this.getTimeRange(hour);
      hourCounts[timeRange] = (hourCounts[timeRange] || 0) + 1;
    });
    
    // Sort by count and get top 3
    const preferredTimes = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([timeRange]) => timeRange);
    
    return preferredTimes;
  }

  // Helper to get time range description
  private getTimeRange(hour: number): string {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }

  // Helper to calculate consistency score
  private calculateConsistencyScore(studySessions: any[]): number {
    if (studySessions.length === 0) return 0;
    
    // Group sessions by day
    const sessionsByDay: Record<string, number> = {};
    
    studySessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
    });
    
    // Count unique days with study sessions in the last 14 days
    const uniqueDays = Object.keys(sessionsByDay).length;
    
    // Calculate days since first session
    const dates = Object.keys(sessionsByDay).sort();
    const firstSession = new Date(dates[0]);
    const lastSession = new Date(dates[dates.length - 1]);
    const daysSinceFirst = Math.ceil((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate consistency score (0-100)
    const daysToConsider = Math.min(daysSinceFirst, 14);
    return daysToConsider > 0 ? Math.min(100, (uniqueDays / daysToConsider) * 100) : 0;
  }

  // Generate an insight about overall performance
  private generateOverallPerformanceInsight(data: AIPerformanceData): AIGeneratedInsight {
    const averageScore = data.overallAverage;
    let title: string;
    let content: string;
    let priority: string;
    let confidenceScore: number;

    if (averageScore >= 90) {
      title = "Outstanding Overall Performance";
      content = `You're performing exceptionally well with a ${averageScore.toFixed(1)}% average across all subjects. Keep up this excellent work!`;
      priority = "medium";
      confidenceScore = 95;
    } else if (averageScore >= 80) {
      title = "Strong Academic Performance";
      content = `Your overall average of ${averageScore.toFixed(1)}% shows you're doing very well. Focus on maintaining this strong performance.`;
      priority = "medium";
      confidenceScore = 90;
    } else if (averageScore >= 70) {
      title = "Good Academic Standing";
      content = `With a ${averageScore.toFixed(1)}% overall average, you're in good academic standing. There's potential to push into the excellent range with targeted improvements.`;
      priority = "medium";
      confidenceScore = 85;
    } else if (averageScore >= 60) {
      title = "Room for Overall Improvement";
      content = `Your current average of ${averageScore.toFixed(1)}% shows you're passing, but there's significant room for improvement. Focus on strengthening your understanding of core concepts.`;
      priority = "high";
      confidenceScore = 80;
    } else {
      title = "Academic Performance Alert";
      content = `Your overall average of ${averageScore.toFixed(1)}% indicates you're facing some challenges. Let's develop a structured plan to address the areas where you need the most support.`;
      priority = "high";
      confidenceScore = 90;
    }

    return {
      insightType: 'performance',
      title,
      content,
      confidenceScore,
      priority
    };
  }

  // Generate subject-specific insight
  private generateSubjectInsight(subject: any, data: AIPerformanceData): AIGeneratedInsight {
    const { name, averageScore, improvementRate } = subject;
    let title: string;
    let content: string;
    let priority: string;
    let confidenceScore: number;
    
    // Compare to overall average
    const comparedToOverall = averageScore - data.overallAverage;
    
    if (improvementRate > 5) {
      title = `Significant Improvement in ${name}`;
      content = `You've shown remarkable improvement in ${name} with an upward trend of ${improvementRate.toFixed(1)}%. Keep using the study techniques that are working for you.`;
      priority = "medium";
      confidenceScore = 85;
    } else if (improvementRate < -5) {
      title = `Declining Performance in ${name}`;
      content = `Your performance in ${name} has decreased by ${Math.abs(improvementRate).toFixed(1)}%. Consider increasing your study time for this subject and reviewing earlier concepts.`;
      priority = "high";
      confidenceScore = 80;
    } else if (comparedToOverall > 10) {
      title = `${name} is Your Strength`;
      content = `At ${averageScore.toFixed(1)}%, your performance in ${name} is ${comparedToOverall.toFixed(1)}% above your overall average. This is clearly a strength you can build on.`;
      priority = "low";
      confidenceScore = 90;
    } else if (comparedToOverall < -10) {
      title = `${name} Needs Attention`;
      content = `Your average in ${name} is ${Math.abs(comparedToOverall).toFixed(1)}% below your overall performance. Additional focused study time could help bring this up to your usual standard.`;
      priority = "high";
      confidenceScore = 85;
    } else {
      title = `${name} Performance Analysis`;
      content = `Your performance in ${name} is consistent with your overall academic trend. Current average: ${averageScore.toFixed(1)}%.`;
      priority = "medium";
      confidenceScore = 75;
    }
    
    return {
      insightType: 'performance',
      title,
      content,
      confidenceScore,
      priority,
      subjectId: subject.id
    };
  }

  // Generate study pattern insight
  private generateStudyPatternInsight(studyPatterns: any): AIGeneratedInsight {
    const { weeklyStudyHours, preferredStudyTimes, consistencyScore, currentStreak } = studyPatterns;
    
    let title: string;
    let content: string;
    let priority: string;
    let confidenceScore: number;
    
    if (consistencyScore >= 80) {
      title = "Excellent Study Consistency";
      content = `You have a very consistent study pattern (${consistencyScore.toFixed(0)}% consistency) with a current streak of ${currentStreak} days. Your preferred study times are ${preferredStudyTimes.join(', ')} with an average of ${weeklyStudyHours.toFixed(1)} hours weekly.`;
      priority = "low";
      confidenceScore = 90;
    } else if (consistencyScore >= 50) {
      title = "Good Study Habits Forming";
      content = `You're developing good study consistency (${consistencyScore.toFixed(0)}%) and currently have a ${currentStreak}-day streak. You typically study during ${preferredStudyTimes.join(', ')} for about ${weeklyStudyHours.toFixed(1)} hours per week.`;
      priority = "medium";
      confidenceScore = 85;
    } else if (weeklyStudyHours < 10) {
      title = "Increase Your Study Time";
      content = `You're currently studying about ${weeklyStudyHours.toFixed(1)} hours per week, which may not be enough to maximize your performance. Aim for more consistent daily sessions.`;
      priority = "high";
      confidenceScore = 80;
    } else {
      title = "Study Pattern Analysis";
      content = `You typically study during ${preferredStudyTimes.join(', ')} for about ${weeklyStudyHours.toFixed(1)} hours weekly. Your consistency rating is ${consistencyScore.toFixed(0)}%. Try to develop more regular study habits for better results.`;
      priority = "medium";
      confidenceScore = 75;
    }
    
    return {
      insightType: 'study_pattern',
      title,
      content,
      confidenceScore,
      priority
    };
  }

  // Generate goal-related insight
  private generateGoalInsight(goals: any[]): AIGeneratedInsight {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.progress >= 100).length;
    const onTrackGoals = goals.filter(goal => goal.progress >= 50 && goal.progress < 100).length;
    const needsAttentionGoals = goals.filter(goal => goal.progress < 50).length;
    
    let title: string;
    let content: string;
    let priority: string;
    let confidenceScore: number;
    
    if (needsAttentionGoals > onTrackGoals + completedGoals) {
      title = "Goal Progress Alert";
      content = `${needsAttentionGoals} out of ${totalGoals} goals need your attention as they're below 50% progress. Focus on breaking these down into smaller, manageable tasks.`;
      priority = "high";
      confidenceScore = 85;
    } else if (completedGoals > 0) {
      title = "Goal Achievement Success";
      content = `You've completed ${completedGoals} goal(s) and have ${onTrackGoals} on track. This shows good progress toward your academic objectives.`;
      priority = "medium";
      confidenceScore = 90;
    } else if (onTrackGoals > needsAttentionGoals) {
      title = "Goals On Track";
      content = `Most of your goals (${onTrackGoals} out of ${totalGoals}) are on track with more than 50% progress. Keep up the momentum!`;
      priority = "medium";
      confidenceScore = 80;
    } else {
      title = "Goal Progress Summary";
      content = `You have ${totalGoals} active goals with ${completedGoals} completed, ${onTrackGoals} on track, and ${needsAttentionGoals} needing attention.`;
      priority = "medium";
      confidenceScore = 75;
    }
    
    return {
      insightType: 'prediction',
      title,
      content,
      confidenceScore,
      priority
    };
  }

  // Generate overall suggestion
  private generateOverallSuggestion(data: AIPerformanceData): AIGeneratedSuggestion {
    const averageScore = data.overallAverage;
    
    if (averageScore >= 90) {
      return {
        title: "Challenge Yourself With Advanced Topics",
        description: "You're performing at an excellent level. Consider tackling more challenging content or helping peers to deepen your understanding further.",
        type: "improvement",
        priority: "medium",
        category: "advanced_learning",
        estimatedTime: "Ongoing",
        confidenceScore: 85
      };
    } else if (averageScore >= 80) {
      return {
        title: "Implement Spaced Repetition for Long-term Retention",
        description: "You're doing well, but to secure your knowledge for the long term, try implementing a spaced repetition system for reviewing material.",
        type: "study_method",
        priority: "medium",
        category: "memory_technique",
        resourceUrl: "https://ncase.me/remember/",
        estimatedTime: "15-20 min daily",
        confidenceScore: 90
      };
    } else if (averageScore >= 70) {
      return {
        title: "Try the Feynman Technique for Better Understanding",
        description: "To improve your understanding of concepts, practice explaining them in simple terms as if teaching someone else. This helps identify gaps in your knowledge.",
        type: "study_method",
        priority: "high",
        category: "comprehension",
        resourceUrl: "https://fs.blog/feynman-technique/",
        estimatedTime: "30 min per topic",
        confidenceScore: 88
      };
    } else if (averageScore >= 60) {
      return {
        title: "Create a Structured Study Schedule",
        description: "Your performance indicates you might benefit from a more structured approach to studying. Create a weekly schedule with specific time blocks for each subject.",
        type: "improvement",
        priority: "high",
        category: "time_management",
        estimatedTime: "1 hour to set up",
        confidenceScore: 92
      };
    } else {
      return {
        title: "Focus on Core Concepts First",
        description: "Your current scores suggest focusing on mastering the fundamental concepts before moving to advanced topics. Consider meeting with your teachers for additional support.",
        type: "improvement",
        priority: "high",
        category: "foundational_knowledge",
        estimatedTime: "Ongoing",
        confidenceScore: 95
      };
    }
  }

  // Generate subject-specific suggestion
  private generateSubjectSuggestion(subject: any): AIGeneratedSuggestion {
    const { name, averageScore, improvementRate, id } = subject;
    
    if (improvementRate < -5) {
      return {
        title: `Review Fundamentals in ${name}`,
        description: `Your recent performance in ${name} shows a decline. Try revisiting the core concepts from earlier units to strengthen your foundation before continuing.`,
        type: "improvement",
        priority: "high",
        category: "review",
        subjectId: id,
        confidenceScore: 85
      };
    } else if (averageScore < 70) {
      return {
        title: `${name}: Practice with Additional Resources`,
        description: `To improve your performance in ${name}, supplement your regular study with additional practice resources like problem sets, online tutorials, or study groups.`,
        type: "resource",
        priority: "high",
        category: "external_resource",
        estimatedTime: "3-5 hours weekly",
        subjectId: id,
        confidenceScore: 90
      };
    } else if (averageScore >= 90) {
      return {
        title: `Explore Advanced ${name} Topics`,
        description: `You're excelling in ${name}! Consider exploring more advanced topics or engaging with the subject through projects or competitions to further develop your skills.`,
        type: "improvement",
        priority: "low",
        category: "enrichment",
        subjectId: id,
        confidenceScore: 80
      };
    } else {
      return {
        title: `Create ${name} Concept Maps`,
        description: `To strengthen your understanding in ${name}, try creating visual concept maps that connect different topics and highlight relationships between key ideas.`,
        type: "study_method",
        priority: "medium",
        category: "visual_learning",
        estimatedTime: "45-60 min",
        subjectId: id,
        confidenceScore: 85
      };
    }
  }

  // Generate study pattern suggestion
  private generateStudyPatternSuggestion(studyPatterns: any): AIGeneratedSuggestion {
    const { weeklyStudyHours, consistencyScore } = studyPatterns;
    
    if (weeklyStudyHours < 10) {
      return {
        title: "Increase Weekly Study Time",
        description: "Your current study time is below the recommended amount for optimal academic performance. Try adding 2-3 more study sessions each week, even if they're short.",
        type: "improvement",
        priority: "high",
        category: "time_management",
        confidenceScore: 90
      };
    } else if (consistencyScore < 50) {
      return {
        title: "Develop a Consistent Study Routine",
        description: "Your study pattern is inconsistent. Try studying at the same times each day to develop a habit. Even 20-30 minute sessions can make a difference if they're regular.",
        type: "study_method",
        priority: "high",
        category: "consistency",
        estimatedTime: "Ongoing",
        confidenceScore: 85
      };
    } else if (consistencyScore >= 80) {
      return {
        title: "Optimize Your Productive Study Times",
        description: "You have excellent study consistency. Now focus on quality by identifying your most productive times of day and scheduling your most challenging work during those periods.",
        type: "study_method",
        priority: "medium",
        category: "productivity",
        confidenceScore: 88
      };
    } else {
      return {
        title: "Try the Pomodoro Technique",
        description: "To improve focus during study sessions, try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break. This helps maintain concentration and avoid burnout.",
        type: "study_method",
        priority: "medium",
        category: "focus",
        resourceUrl: "https://pomofocus.io/",
        confidenceScore: 92
      };
    }
  }

  // Generate goal-related suggestion
  private generateGoalSuggestion(goals: any[]): AIGeneratedSuggestion {
    const needsAttentionGoals = goals.filter(goal => goal.progress < 50);
    
    if (needsAttentionGoals.length > 0) {
      return {
        title: "Break Down Your Academic Goals",
        description: "Some of your goals show limited progress. Try breaking them down into smaller, more manageable milestones that you can achieve in 1-2 week intervals.",
        type: "improvement",
        priority: "high",
        category: "goal_setting",
        estimatedTime: "30-45 min",
        confidenceScore: 85
      };
    } else if (goals.length < 3) {
      return {
        title: "Set More Specific Learning Goals",
        description: "Setting clear, measurable goals helps direct your study efforts. Consider adding more specific goals for each subject with target dates and measurable outcomes.",
        type: "improvement",
        priority: "medium",
        category: "goal_setting",
        confidenceScore: 80
      };
    } else {
      return {
        title: "Weekly Goal Review Session",
        description: "Schedule a weekly 15-minute session to review progress on your goals, adjust them as needed, and plan specific actions for the coming week to keep yourself on track.",
        type: "study_method",
        priority: "medium",
        category: "organization",
        confidenceScore: 90
      };
    }
  }
}

// Export an instance of the AIService class for easy importing
export const aiService = new AIService();
