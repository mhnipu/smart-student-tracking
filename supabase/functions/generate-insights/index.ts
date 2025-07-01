import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.0.0";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

// Constants
const SYSTEM_PROMPT = `
You are an AI academic advisor specialized in analyzing student performance data and providing personalized insights and suggestions.
Your task is to analyze the provided student data and generate:
1. Insights about their performance patterns
2. Specific, actionable suggestions to help them improve
3. Predictions about their future performance if they continue current patterns

Focus on being specific, data-driven, and personalized. Use the student's actual grades, study patterns, and subject-specific performance.
Format your output as a structured JSON with clear insight types, titles, descriptions, and confidence scores.
`;

// Types for student data
interface StudentData {
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

interface AIGeneratedInsight {
  insightType: string;
  title: string;
  content: string;
  confidenceScore: number;
  priority: string;
  subjectId?: string;
}

interface AIGeneratedSuggestion {
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

interface AIResponse {
  insights: AIGeneratedInsight[];
  suggestions: AIGeneratedSuggestion[];
}

// Main handler for requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get student data for analysis
    const studentData = await prepareStudentData(supabaseClient, userId);

    if (!studentData) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve sufficient student data for analysis" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate AI insights
    const aiResponse = await generateAIAnalysis(studentData);

    // Save insights to database
    await saveInsightsToDatabase(supabaseClient, userId, aiResponse.insights);

    // Save suggestions to database
    await saveSuggestionsToDatabase(supabaseClient, userId, aiResponse.suggestions);

    return new Response(
      JSON.stringify({
        message: "Generated AI insights and suggestions successfully",
        insights: aiResponse.insights.length,
        suggestions: aiResponse.suggestions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-insights function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to prepare student data for analysis
async function prepareStudentData(supabase, userId): Promise<StudentData | null> {
  try {
    // Get user's subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from("subjects")
      .select("id, name, color, current_grade, target_grade, study_priority, total_study_time")
      .eq("user_id", userId);

    if (subjectsError) throw subjectsError;

    // Get all marks
    const { data: marksData, error: marksError } = await supabase
      .from("marks")
      .select(`
        id, score, max_score, percentage, test_type, test_name, date, 
        subjects(id, name, color)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (marksError) throw marksError;

    // Get study sessions
    const { data: studyData, error: studyError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false });

    if (studyError) throw studyError;

    // Get goals
    const { data: goalsData, error: goalsError } = await supabase
      .from("goals")
      .select(`
        id, title, target_score, current_score, progress, status, priority, 
        subjects(id, name)
      `)
      .eq("user_id", userId)
      .eq("status", "active");

    if (goalsError) throw goalsError;

    // Get user stats
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_study_time, current_streak, longest_streak, preferred_study_time")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Process subjects
    const subjects = subjectsData.map((subject) => {
      const subjectMarks = marksData.filter(
        (mark) => mark.subjects?.id === subject.id
      );
      const scores = subjectMarks.map((mark) => mark.percentage);
      const subjectStudyTime = studyData
        .filter((session) => session.subject_id === subject.id)
        .reduce((total, session) => total + (session.duration_minutes || 0), 0);

      // Calculate improvement rate
      let improvementRate = 0;
      if (scores.length >= 4) {
        const recentAvg =
          scores
            .slice(0, Math.ceil(scores.length / 2))
            .reduce((a, b) => a + b, 0) / Math.ceil(scores.length / 2);
        const earlierAvg =
          scores
            .slice(Math.ceil(scores.length / 2))
            .reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
        improvementRate = recentAvg - earlierAvg;
      }

      return {
        id: subject.id,
        name: subject.name,
        averageScore: scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
        recentScores: scores.slice(0, 5),
        improvementRate,
        studyTime: subjectStudyTime,
      };
    });

    // Calculate overall average
    const allScores = marksData.map((mark) => mark.percentage);
    const overallAverage = allScores.length
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

    // Format recent marks
    const recentMarks = marksData.slice(0, 10).map((mark) => ({
      id: mark.id,
      score: mark.score,
      percentage: mark.percentage,
      testType: mark.test_type,
      testName: mark.test_name,
      date: mark.date,
      subjectName: mark.subjects?.name || "Unknown",
    }));

    // Analyze study patterns
    const studyTimes = studyData.map((session) => {
      const startTime = new Date(session.start_time);
      return startTime.getHours();
    });

    const preferredStudyTimes = analyzePreferredStudyTimes(studyTimes);

    // Calculate weekly study hours
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyStudyMinutes = studyData
      .filter((session) => new Date(session.start_time) >= oneWeekAgo)
      .reduce((total, session) => total + (session.duration_minutes || 0), 0);

    const weeklyStudyHours = weeklyStudyMinutes / 60;

    // Calculate consistency score
    const consistencyScore = calculateConsistencyScore(studyData);

    // Format goals data
    const goals = goalsData.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetScore: goal.target_score,
      currentScore: goal.current_score,
      progress: goal.progress,
      subjectName: goal.subjects?.name,
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
        currentStreak: userData?.current_streak || 0,
      },
      goals,
    };
  } catch (error) {
    console.error("Error preparing student data for AI analysis:", error);
    return null;
  }
}

// Helper method to analyze preferred study times
function analyzePreferredStudyTimes(studyHours: number[]): string[] {
  // Count occurrences of each hour
  const hourCounts: Record<string, number> = {};

  studyHours.forEach((hour) => {
    const timeRange = getTimeRange(hour);
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
function getTimeRange(hour: number): string {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

// Helper to calculate consistency score
function calculateConsistencyScore(studySessions: any[]): number {
  if (studySessions.length === 0) return 0;

  // Group sessions by day
  const sessionsByDay: Record<string, number> = {};

  studySessions.forEach((session) => {
    const date = new Date(session.start_time).toISOString().split("T")[0];
    sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
  });

  // Count unique days with study sessions in the last 14 days
  const uniqueDays = Object.keys(sessionsByDay).length;

  // Calculate days since first session
  const dates = Object.keys(sessionsByDay).sort();
  if (dates.length === 0) return 0;
  
  const firstSession = new Date(dates[0]);
  const lastSession = new Date(dates[dates.length - 1]);
  const daysSinceFirst = Math.ceil(
    (lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate consistency score (0-100)
  const daysToConsider = Math.min(daysSinceFirst, 14);
  return daysToConsider > 0
    ? Math.min(100, (uniqueDays / daysToConsider) * 100)
    : 0;
}

// Generate AI analysis using OpenAI
async function generateAIAnalysis(studentData: StudentData): Promise<AIResponse> {
  try {
    // Create AI prompt with student data
    const userPrompt = `
      Please analyze this student's performance data and generate personalized insights and suggestions.
      
      Student Data:
      ${JSON.stringify(studentData, null, 2)}
      
      Generate a JSON response with two arrays:
      1. "insights": An array of 3-5 insight objects with these properties:
         - insightType: One of "performance", "study_pattern", "prediction", or "recommendation"
         - title: A concise, specific title for the insight
         - content: Detailed explanation with specific references to the student's data
         - confidenceScore: Number between 0-100 indicating confidence
         - priority: "high", "medium", or "low"
         - subjectId: Optional subject ID if the insight is subject-specific
      
      2. "suggestions": An array of 3-5 suggestion objects with these properties:
         - title: A concise, actionable title
         - description: Detailed explanation of how to implement the suggestion
         - type: One of "study_method", "resource", "improvement", "practice", or "time_management"
         - priority: "high", "medium", or "low"
         - category: A category like "memory_technique", "time_management", "focus", etc.
         - resourceUrl: Optional URL to a helpful resource
         - estimatedTime: Optional estimated time needed, e.g. "15-20 min daily"
         - subjectId: Optional subject ID if the suggestion is subject-specific
         - confidenceScore: Number between 0-100 indicating confidence
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    // Parse the AI response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const parsedResponse = JSON.parse(content) as AIResponse;
    
    return {
      insights: parsedResponse.insights || [],
      suggestions: parsedResponse.suggestions || []
    };
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    
    // Return fallback analysis if AI fails
    return generateFallbackAnalysis(studentData);
  }
}

// Save insights to the database
async function saveInsightsToDatabase(
  supabase,
  userId: string,
  insights: AIGeneratedInsight[]
): Promise<void> {
  if (!insights || insights.length === 0) return;

  const insightsToInsert = insights.map((insight) => ({
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

  const { error } = await supabase.from("ai_insights").insert(insightsToInsert);

  if (error) {
    console.error("Error saving AI insights:", error);
    throw error;
  }
}

// Save suggestions to the database
async function saveSuggestionsToDatabase(
  supabase,
  userId: string,
  suggestions: AIGeneratedSuggestion[]
): Promise<void> {
  if (!suggestions || suggestions.length === 0) return;

  const suggestionsToInsert = suggestions.map((suggestion) => ({
    user_id: userId,
    title: suggestion.title,
    description: suggestion.description,
    type: suggestion.type,
    priority: suggestion.priority,
    status: "active",
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
    .from("suggestions")
    .insert(suggestionsToInsert);

  if (error) {
    console.error("Error saving AI suggestions:", error);
    throw error;
  }
}

// Generate fallback analysis if AI fails
function generateFallbackAnalysis(studentData: StudentData): AIResponse {
  const insights: AIGeneratedInsight[] = [];
  const suggestions: AIGeneratedSuggestion[] = [];

  // Generate a basic insight based on overall performance
  insights.push({
    insightType: "performance",
    title: "Overall Academic Performance",
    content: `Your current overall average is ${studentData.overallAverage.toFixed(1)}%. Consistent study habits will help maintain or improve this performance.`,
    confidenceScore: 90,
    priority: studentData.overallAverage >= 80 ? "medium" : "high"
  });

  // Add study pattern insight
  insights.push({
    insightType: "study_pattern",
    title: "Study Consistency Analysis",
    content: `You've maintained a ${studentData.studyPatterns.currentStreak}-day study streak with about ${studentData.studyPatterns.weeklyStudyHours.toFixed(1)} hours of study per week.`,
    confidenceScore: 85,
    priority: "medium"
  });

  // Add a general suggestion
  suggestions.push({
    title: "Implement Spaced Repetition",
    description: "Review material at increasing intervals to improve long-term retention. Start with daily reviews, then every 3 days, then weekly.",
    type: "study_method",
    priority: "medium",
    category: "memory_technique",
    estimatedTime: "15-20 min daily",
    confidenceScore: 95
  });

  // Add time management suggestion
  suggestions.push({
    title: "Use the Pomodoro Technique",
    description: "Study in focused 25-minute intervals with 5-minute breaks to maintain concentration and avoid burnout.",
    type: "time_management",
    priority: "medium",
    category: "focus",
    resourceUrl: "https://pomofocus.io/",
    estimatedTime: "25 min sessions",
    confidenceScore: 90
  });

  return { insights, suggestions };
}