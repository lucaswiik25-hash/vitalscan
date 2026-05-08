import React from 'react';
import { format } from 'date-fns';

export default function RecentlyUploaded({ meals = [] }) {
  if (meals.length === 0) {
    return (
      <div className="px-5 mt-6">
        <h2 className="text-xl font-bold text-foreground mb-3">Recently uploaded</h2>
        <div className="bg-muted/50 border border-border rounded-[20px] p-8 flex flex-col items-center">
          <span className="text-5xl mb-3">🥗</span>
          <div className="w-20 h-1.5 bg-muted-foreground/10 rounded-full mb-1" />
          <div className="w-14 h-1.5 bg-muted-foreground/10 rounded-full mb-4" />
          <p className="text-sm text-muted-foreground text-center">Tap + to add your first meal of the day</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 mt-6">
      <h2 className="text-xl font-bold text-foreground mb-3">Recently uploaded</h2>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-4">
            {meal.image_url ? (
              <img src={meal.image_url} alt={meal.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">🍽️</div>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{meal.name}</p>
              <p className="text-xs text-muted-foreground">{meal.calories} cal • {meal.time || format(new Date(meal.created_date), 'h:mm a')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">{meal.calories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}