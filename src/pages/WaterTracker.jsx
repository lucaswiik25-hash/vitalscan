import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { listHydrationLogs, createHydrationLog, deleteHydrationLog } from '@/lib/db';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const dailyTarget = profile.water_target_ml || 4000;

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['waterLogs', TODAY],
    queryFn: () => listHydrationLogs({ date: TODAY }),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => listHydrationLogs(),
  });

  const consumed = todayLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);

  const logMutation = useMutation({
    mutationFn: () => createHydrationLog({ date: TODAY, amount_ml: 250, type: 'water', slot: 'morning' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['waterLogs', TODAY] });
      const prev = queryClient.getQueryData(['waterLogs', TODAY]);
      const optimistic = { id: `opt-${Date.now()}`, date: TODAY, amount_ml: 250, type: 'water', created_at: new Date().toISOString() };
      queryClient.setQueryData(['waterLogs', TODAY], (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['waterLogs', TODAY], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
      queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
    },
  });

  // Build last 5 days bar data
  const last5 = Array.from({ length: 5 }, (_, i) => {
    const d = subDays(new Date(), 4 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return { label: format(d, 'EEE'), ml: total };
  });

  const maxMl = Math.max(...last5.map(d => d.ml), dailyTarget);

  return (
    <main className="max-w-[447px] w-full mx-auto relative flex flex-col items-center pb-10">
      {/* Top Card — flush to top corners */}
      <div
        className="relative w-full bg-[#e7edf1] overflow-hidden shadow-sm"
        style={{ borderRadius: '0 0 60px 60px' }}
      >
        {/* Blurred Background Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="bg-figma-primary [filter:blur(100px)] rounded-[105px] w-[55.8%] h-[45.9%] opacity-[0.21] absolute top-0 left-[21.8%]" />
          <div className="bg-figma-border-4 [filter:blur(100px)] rounded-[105px] w-[79%] h-[26.2%] opacity-[0.21] absolute top-[22.8%] left-[10.9%]" />
          <div className="bg-figma-surface-4 [filter:blur(100px)] rounded-[105px] w-[101.8%] h-[41.5%] opacity-[0.21] absolute top-[37.5%] left-0" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center pt-14 pb-10">
          {/* Consumed */}
          <motion.p
            key={consumed}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(70px,28.64vw,128px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1 text-center"
          >
            {consumed}
          </motion.p>

          {/* "of" */}
          <p className="text-[clamp(28px,11vw,50px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1 text-center opacity-60">
            of
          </p>

          {/* Target */}
          <p className="text-[clamp(40px,16vw,72px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1 text-center">
            {dailyTarget}
          </p>

          {/* Log Button — smaller */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending}
            className="mt-8 bg-figma-primary rounded-full px-10 py-3 flex items-center justify-center"
          >
            <span className="text-[clamp(18px,5vw,26px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1">
              {logMutation.isPending ? '...' : '+ Log 250ml'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Bottom Chart Section */}
      <div className="w-[94.4%] mt-[20px] flex flex-col gap-y-[10px]">
        <p className="text-[clamp(22px,8.95vw,40px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1 ml-[2.5%]">
          7-Days
        </p>

        <div className="grid grid-cols-5 w-full gap-1">
          {last5.map((day, i) => {
            const heightPct = maxMl > 0 ? Math.max(8, (day.ml / maxMl) * 100) : 8;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full aspect-[84/149] relative flex items-end justify-center">
                  {/* Background Track */}
                  <div className="absolute inset-0 w-[90%] mx-auto bg-figma-text-1 rounded-[71px] opacity-10" />
                  {/* Animated Fill */}
                  <div className="relative w-[90%] mx-auto h-full flex items-end z-10">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, type: 'spring', bounce: 0.2 }}
                      className="w-full bg-figma-text-1 rounded-[71px]"
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-figma-text-1 opacity-50">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}