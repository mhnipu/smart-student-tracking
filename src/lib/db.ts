import { supabase } from './supabase';

export async function db_fetchDashboardData(userId: string) {
    console.log(`Fetching dashboard data for user: ${userId}`);
    try {
        const [
            subjectsRes,
            marksRes,
            goalsRes,
            sessionsRes
        ] = await Promise.all([
            supabase.from('subjects').select('*').eq('user_id', userId),
            supabase.from('marks').select('*, subjects(*)').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('goals').select('*').eq('user_id', userId).order('target_date', { ascending: true }),
            supabase.from('study_sessions').select('duration_minutes').eq('user_id', userId)
        ]);

        if (subjectsRes.error) throw new Error(`Failed to fetch subjects: ${subjectsRes.error.message}`);
        if (marksRes.error) throw new Error(`Failed to fetch marks: ${marksRes.error.message}`);
        if (goalsRes.error) throw new Error(`Failed to fetch goals: ${goalsRes.error.message}`);
        if (sessionsRes.error) throw new Error(`Failed to fetch study sessions: ${sessionsRes.error.message}`);
        
        const subjects = subjectsRes.data || [];
        const marks = marksRes.data || [];
        const goals = goalsRes.data || [];
        const studySessions = sessionsRes.data || [];

        // 1. Subject Breakdown
        const subjectBreakdown = subjects.reduce((acc, subject) => {
            const subjectMarks = marks.filter(mark => mark.subject_id === subject.id);
            const totalMarks = subjectMarks.length;
            const averageScore = totalMarks > 0 ? subjectMarks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / totalMarks : 0;
            
            acc[subject.id] = {
                name: subject.name,
                totalMarks,
                averageScore,
                color: subject.color
            };
            return acc;
        }, {});

        // 2. Performance Chart Data (Weekly Trend)
        const weeklyData = {};
        marks.forEach(mark => {
            const weekStart = new Date(mark.date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { scores: [], count: 0 };
            }
            weeklyData[weekKey].scores.push(mark.percentage);
            weeklyData[weekKey].count++;
        });

        const performanceChartData = Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
            week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
            count: data.count
        })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

        // 3. Recent Marks
        const recentMarks = marks.slice(0, 5);

        // 4. Total study time
        const totalStudyTime = studySessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

        const dashboardData = {
            subjects,
            subjectBreakdown,
            performanceChartData,
            recentMarks,
            goals,
            aiInsights: [], // Placeholder for AI insights
            totalStudyTime,
        };
        
        console.log("Successfully fetched and processed dashboard data");
        return dashboardData;

    } catch (error) {
        console.error('Error in db_fetchDashboardData:', error);
        throw error;
    }
} 