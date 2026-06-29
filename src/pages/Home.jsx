import React from 'react';

const Frame1 = () => {
  return (
    <div className="w-full h-screen relative bg-[url('/mountain.jpg')] bg-cover bg-center overflow-hidden text-left text-[#fff] font-['Inria_Serif']">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="absolute top-[1.5rem] left-[1.75rem] right-[1.75rem] flex justify-between items-center z-10">
        <h2 className="m-0 text-[3.25rem] font-normal font-['SF_Pro'] tracking-tight">
          Scanly
        </h2>
        
        {/* Streak Counter Asset */}
        <div className="relative flex items-center justify-center w-[4.5rem] h-[2.5rem]">
          <img
            className="absolute inset-0 w-full h-full object-contain"
            alt="Streak Bg"
            src="/streak-bg.png" 
          />
          <div className="relative flex items-center gap-1 z-10 font-[Inter] font-semibold text-[1.25rem]">
            <span>🔥</span>
            <span className="text-white">1</span>
          </div>
        </div>
      </div>

      {/* 2. CORE SCORE VISUAL DOCK */}
      <div className="absolute top-[6.5rem] inset-x-0 flex flex-col items-center z-10">
        <h2 className="m-0 text-[5rem] font-normal text-black drop-shadow-sm tracking-wide">
          Score
        </h2>
        
        {/* Central Metric Container */}
        <div className="relative w-[24rem] h-[24rem] flex flex-col items-center justify-center mt-2">
          {/* 3D Liquid/Chrome Progress Ring Overlaid */}
          <img 
            src="/score-ring.png" 
            className="absolute inset-0 w-full h-full object-contain drop-shadow-lg" 
            alt="Progress Ring" 
          />
          
          {/* Centered Score Number */}
          <h1 className="m-0 relative text-[7.5rem] font-normal leading-none mt-6 tracking-tighter drop-shadow-md text-white">
            80
          </h1>

          {/* Carousel Dot Indicators */}
          <div className="absolute bottom-[2rem] flex gap-1.5 justify-center items-center">
            <div className="rounded-[26px] bg-white w-[1.25rem] h-[0.5rem] transition-all" />
            <div className="rounded-[26px] bg-white/40 w-[0.5rem] h-[0.5rem]" />
            <div className="rounded-[26px] bg-white/40 w-[0.5rem] h-[0.5rem]" />
            <div className="rounded-[26px] bg-white/40 w-[0.5rem] h-[0.5rem]" />
          </div>
        </div>
      </div>

      {/* 3. INSIGHT FEEDBACK MODULE TEXT */}
      <div className="absolute bottom-[7rem] inset-x-0 px-6 text-center z-10 flex justify-center">
        <div className="w-full max-w-[28rem] text-[1.25rem] leading-[1.6rem] font-normal tracking-wide text-white font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Last nights sleep as extrodinary good. you logged over 9h of sleep. this means you have officially payed your sleep dept only issue i see is your eating habits. you ate only 2 times yesterday. and consumed only 800kcal. if you keep that up you will ot hit your goal of gaining muscle
        </div>
      </div>

      {/* 4. PREMIUM GLASSMORPHIC BOTTOM NAV BAR */}
      <div className="absolute bottom-[1.5rem] inset-x-4 h-[5rem] rounded-[30px] bg-white/10 border border-white/10 backdrop-blur-[20px] shadow-2xl flex items-center justify-between px-6 z-20">
        
        {/* Left Side Active Nav Dock */}
        <div className="flex items-center gap-1.5 bg-white rounded-[24px] px-4 py-2 shadow-md">
          <span className="text-black text-[1.3rem]">🏠</span>
          <span className="text-black font-semibold text-[1rem] font-sans">Home</span>
        </div>

        {/* Floating Add Action Button */}
        <button className="cursor-pointer border-none w-[3.5rem] h-[3.5rem] rounded-full bg-gradient-to-tr from-[#1a1f2c] to-[#2d3748] flex items-center justify-center text-white text-[2rem] font-light shadow-xl hover:scale-105 active:scale-95 transition-all">
          +
        </button>
      </div>

    </div>
  );
};

export default Frame1;
