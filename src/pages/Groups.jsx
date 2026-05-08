import React from 'react';
import { Users } from 'lucide-react';

export default function Groups() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Groups</h1>
      </div>
      <div className="px-5">
        <div className="bg-muted/50 border border-border rounded-[20px] p-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Coming soon</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">Join groups to compete and stay motivated with friends</p>
        </div>
      </div>
    </div>
  );
}