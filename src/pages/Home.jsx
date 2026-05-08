import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Header from '../components/home/Header';
import WeekCalendar from '../components/home/WeekCalendar';
import NutriCarousel from '../components/home/NutriCarousel';
import RecentlyUploaded from '../components/home/RecentlyUploaded';

export default function Home() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profile = profiles[0] || {};

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (profiles.length > 0 && !profile.onboarding_complete) {
      navigate('/onboarding');
    }
  }, [profiles, profile, navigate]);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => base44.entities.Meal.filter({ date: today, logged: true }),
  });

  const { data: allMeals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  // Calculate consumed totals from today's meals
  const consumed = todayMeals.reduce((acc, meal) => ({
    calories: (acc.calories || 0) + (meal.calories || 0),
    protein: (acc.protein || 0) + (meal.protein || 0),
    carbs: (acc.carbs || 0) + (meal.carbs || 0),
    fat: (acc.fat || 0) + (meal.fat || 0),
    fiber: (acc.fiber || 0) + (meal.fiber || 0),
    sugar: (acc.sugar || 0) + (meal.sugar || 0),
    sodium: (acc.sodium || 0) + (meal.sodium || 0),
  }), {});

  // Get dates that have logged meals
  const loggedDates = [...new Set(allMeals.map(m => m.date))];

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="warm-glow min-h-screen">
      <Header streak={profile.streak || 0} />
      <WeekCalendar loggedDates={loggedDates} />
      <div className="mt-2">
        <NutriCarousel profile={profile} consumed={consumed} />
      </div>
      <RecentlyUploaded meals={todayMeals} />
    </div>
  );
}