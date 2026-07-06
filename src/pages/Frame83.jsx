import React, { useState } from "react";
import { motion } from "framer-motion";

export default function NutritionScanner() {
  const [activeTab, setActiveTab] = useState("Food");

  const tabs = ["Food", "Skincare", "Supplement"];

  const recentItems = [
    {
      id: 1,
      name: "Coconut Water",
      score: 99,
      width: "w-[88%]",
      maxWidth: "max-w-[386px]",
      height: "h-[73px]",
      imgSize: "w-[71px] h-[66px]",
    },
    {
      id: 2,
      name: "Banana",
      score: 90,
      width: "w-[84%]",
      maxWidth: "max-w-[370px]",
      height: "h-[72px]",
      imgSize: "w-[67px] h-[60px]",
    },
    {
      id: 3,
      name: "Apple",
      score: 80,
      width: "w-[73%]",
      maxWidth: "max-w-[319px]",
      height: "h-[63px]",
      imgSize: "w-[52px] h-[52px]",
    },
  ];

  return (
    <main className="min-h-screen w-full flex items-start justify-center bg-[#0a0a0a] p-4 sm:p-8 font-figma-sf-pro">
      {/* Main Device Card */}
      <div className="relative w-full max-w-[439px] min-h-[961px] rounded-[64px] bg-[linear-gradient(180deg,_rgba(90,110,132,1.00)_0%,_rgba(245,245,245,1.00)_100%)] overflow-clip flex flex-col items-center pb-12 shadow-2xl">

        {/* Header / Back Button */}
        <div className="w-full px-[19px] pt-[31px] flex justify-start z-20">
          <button className="w-[47px] h-[46px] rounded-full bg-figma-border-5 flex items-center justify-center hover:opacity-80 transition-opacity">
            <img src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/00d4fd3aa_5066ae3bf_610_55.svg" alt="Back" className="w-[21px] h-[15px]" />
          </button>
        </div>

        {/* Title Group */}
        <div className="w-full flex flex-col mt-[11px] pl-[clamp(16px,8.2vw,43px)] z-20">
          <div className="relative inline-block self-start">
            {/* Shadow Layer */}
            <span className="absolute top-[3px] left-[2px] text-[clamp(53px,18.22vw,96px)] font-[590] leading-[1.1979] tracking-[-0.0104em] text-figma-text-1 whitespace-nowrap select-none">
              Nutrition
            </span>
            {/* Main Text Layer */}
            <span className="relative text-[clamp(53px,18.22vw,96px)] font-[590] leading-[1.1979] tracking-[-0.0104em] text-figma-primary whitespace-nowrap">
              Nutrition
            </span>
          </div>
          <span className="text-[clamp(26px,9.11vw,48px)] font-[590] leading-[1.1875] tracking-[-0.0104em] text-figma-primary mt-[-26px] ml-[21%] z-20">
            Scanner
          </span>
        </div>

        {/* Analyse Button */}
        <button className="mt-[clamp(51px,38.5vw,203px)] w-[85%] max-w-[372px] h-[57px] rounded-[200px] bg-figma-highlight-4 opacity-[0.78] shadow-[0px_4px_100px_13px_rgba(17,48,255,0.54)] flex items-center justify-center z-20 hover:opacity-100 hover:scale-[1.02] transition-all active:scale-95">
          <span className="text-[clamp(18px,6.07vw,32px)] font-[590] leading-[1.1875] tracking-[-0.0094em] text-figma-primary">
            Analyse
          </span>
        </button>

        {/* Pagination Dots */}
        <div className="mt-[clamp(16px,7.4vw,39px)] flex items-center gap-1 z-20">
          <div className="w-[21px] h-3.5 rounded-[26px] bg-figma-text-1" />
          <div className="w-3 h-3.5 rounded-[26px] bg-figma-text-1" />
          <div className="w-3 h-3.5 rounded-[26px] bg-figma-text-1" />
          <div className="w-3 h-3.5 rounded-[26px] bg-figma-text-1" />
          <div className="w-3 h-3.5 rounded-[26px] bg-figma-text-1" />
          <div className="w-3 h-3.5 rounded-[26px] bg-figma-text-1" />
        </div>

        {/* Recent Section */}
        <div className="w-full px-[19px] mt-[13px] flex flex-col z-20">
          <h2 className="text-[clamp(26px,9.11vw,48px)] font-[590] leading-[1.1875] tracking-[-0.0104em] text-figma-text-1 opacity-[0.6]">
            <span className="text-[clamp(18px,6.07vw,32px)]">Recent</span>
          </h2>

          {/* Tabs */}
          <div className="mt-0 w-full max-w-[404px] min-h-[54px] rounded-[62px] bg-figma-muted-4 relative flex items-center px-1.5 self-center">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 h-[46px] flex items-center justify-center z-10"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-[62px] bg-figma-surface-5 z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 text-[clamp(14px,4.55vw,24px)] font-[590] leading-[1.2083] tracking-[-0.0083em] text-figma-primary">
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* List Items */}
          <div className="mt-[19px] w-full flex flex-col items-center gap-1">
            {recentItems.map((item) => (
              <button
                key={item.id}
                className={`${item.width} ${item.maxWidth} ${item.height} rounded-[200px] bg-figma-primary opacity-[0.74] flex items-center justify-between px-3.5 hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-[19px]">
                  <div className={`${item.imgSize} rounded-[14px] bg-figma-primary shrink-0`} />
                  <span className="text-[clamp(18px,6.07vw,32px)] font-[590] leading-[1.1875] tracking-[-0.0094em] text-figma-text-1 opacity-[0.6] text-left leading-tight">
                    {item.name}
                  </span>
                </div>
                <span className="text-[clamp(20px,6.83vw,36px)] font-[590] leading-[1.1944] tracking-[-0.0111em] text-figma-text-1-3 pr-2 shrink-0">
                  {item.score}
                </span>
              </button>
            ))}

            {/* Bottom faded decorative item */}
            <div className="w-[54%] max-w-[236px] min-h-[37px] rounded-[200px] bg-figma-primary opacity-[0.74] mt-1" />
          </div>
        </div>
      </div>
    </main>
  );
}
