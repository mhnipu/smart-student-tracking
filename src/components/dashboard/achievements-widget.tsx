import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Award, TrendingUp, BookOpen, CheckCircle, Flame } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  earned_at?: string;
  progress: number;
}

interface AchievementsWidgetProps {
  userId: string;
}

export function AchievementsWidget({ userId }: AchievementsWidgetProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      // Get user's earned achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (userError) {
        console.error("Error loading user achievements:", userError);
        return;
      }

      // Get all available achievements to show progress
      const { data: allAchievements, error: allError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      if (allError) {
        console.error("Error loading all achievements:", allError);
        return;
      }

      // Merge earned and available achievements
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const mergedAchievements = allAchievements?.map(achievement => {
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          earned_at: userAchievement?.earned_at,
          progress: userAchievement?.progress || 0
        };
      }) || [];

      setAchievements(mergedAchievements.slice(0, 6)); // Show top 6
      
      // Calculate total points
      const points = userAchievements?.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0) || 0;
      setTotalPoints(points);

    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Trophy, Star, Target, Award, TrendingUp, BookOpen, CheckCircle, Flame
    };
    const IconComponent = iconMap[iconName] || Trophy;
    return <IconComponent className="h-5 w-5" />;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Achievements</span>
            </CardTitle>
            <CardDescription>
              {totalPoints} points earned • {achievements.filter(a => a.earned_at).length} unlocked
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-lg border transition-all duration-200 ${
                achievement.earned_at
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className={`p-2 rounded-lg ${
                  achievement.earned_at ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  {getIcon(achievement.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </Badge>
                    <span className="text-xs font-medium text-gray-500">
                      {achievement.points}pts
                    </span>
                  </div>
                </div>
              </div>
              
              {achievement.earned_at && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-green-500 text-white rounded-full p-1">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}