import React from "react";
import { motion } from "framer-motion";

export default function Frame6() {
  return (
    <main className="relative w-full max-w-[457px] mx-auto aspect-[457/965] rounded-[64px] overflow-clip bg-[linear-gradient(180deg,_rgba(90,110,132,1.00)_0%,_rgba(245,245,245,1.00)_100%)] shadow-2xl flex flex-col">
      {/* Dynamic Island */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[125px] min-h-[37px] bg-figma-text-1 rounded-[104px] z-50" />

      {/* Top White Card */}
      <div className="w-full h-[57.3%] bg-figma-primary rounded-b-[62px] z-10 flex flex-col pt-[clamp(16px,11.2vw,51px)] px-[29px] pb-[clamp(16px,9.8vw,45px)] relative shrink-0">
        {/* Header */}
        <div className="flex justify-between items-center relative z-20">
          <div className="w-[41px] h-10 overflow-clip relative">
            <img
              className="w-[35px] h-[37px] absolute top-[3px] left-[5px]"
              src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/18dca49a1_a2db7603f_1001_140_7758_11738.svg"
              alt="Home Icon"
            />
          </div>
          <div className="bg-figma-surface-2 rounded-[200px] w-[45px] min-h-[43px] flex items-center justify-center">
            <span className="text-[clamp(14px,5.25vw,24px)] font-bold font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1">
              AI
            </span>
          </div>
        </div>

        {/* Divider */}
        <img
          className="absolute top-[112px] left-0 w-full h-px opacity-[0.24] z-10"
          src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/68ab84df2_846008a89_1001_118.svg"
          alt="Divider Line"
        />

        {/* Todays Burn Header */}
        <div className="flex justify-between items-center mt-[clamp(16px,9.6vw,44px)] relative z-20">
          <h2 className="text-[clamp(14px,5.25vw,24px)] font-bold font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1">
            Todays Burn
          </h2>
          <div className="bg-figma-text-1 rounded-[50px] w-[74px] h-7 flex items-center justify-center">
            <span className="text-figma-16 font-bold font-figma-inter leading-figma-19 tracking-[-0.8px] text-figma-primary">
              Log
            </span>
          </div>
        </div>

        {/* 70% Center Display */}
        <div className="flex-1 flex items-center justify-center relative z-20">
          {/* Decorative Blurs */}
          <div className="absolute left-[-29px] top-1/2 -translate-y-1/2 bg-[#ea234b] [filter:blur(100px)] rounded-[200px] w-[100px] min-h-[100px] opacity-[0.14] z-0 pointer-events-none" />
          <div className="absolute right-[-29px] top-1/2 -translate-y-1/2 bg-figma-border-2 [filter:blur(100px)] rounded-[200px] w-[100px] min-h-[100px] opacity-[0.15] z-0 pointer-events-none" />

          {/* Percentage Text */}
          <div className="relative w-full max-w-[226px] min-h-[131px]">
            <p className="absolute top-0 left-[7px] text-[clamp(59px,23.63vw,108px)] font-bold font-figma-inter leading-[1.213] tracking-[-0.05em] text-figma-text-1-2 z-0">
              70%
            </p>
            <p className="absolute top-0 left-0 text-[clamp(59px,23.63vw,108px)] font-bold font-figma-inter leading-[1.213] tracking-[-0.05em] text-figma-text-1 z-10">
              70%
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-end relative z-20 w-full">
          <div className="flex flex-col items-start">
            <span className="text-[clamp(14px,5.25vw,24px)] font-medium font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1 mb-1">
              Exercises
            </span>
            <span className="text-[clamp(22px,8.75vw,40px)] font-light font-figma-inter leading-[1.2] tracking-[-0.05em] text-figma-text-1 ml-[clamp(16px,8.1vw,37px)]">
              2
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[clamp(14px,5.25vw,24px)] font-medium font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1 mb-1">
              Burned
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[clamp(22px,8.75vw,40px)] font-light font-figma-inter leading-[1.2] tracking-[-0.05em] text-figma-text-1">
                250
              </span>
              <span className="text-figma-15 font-medium font-figma-inter leading-figma-18 tracking-[-0.8px] text-figma-text-1">
                Kcal
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[clamp(14px,5.25vw,24px)] font-medium font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1 mb-1">
              Remaining
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[clamp(22px,8.75vw,40px)] font-light font-figma-inter leading-[1.2] tracking-[-0.05em] text-figma-text-1">
                350
              </span>
              <span className="text-figma-15 font-medium font-figma-inter leading-figma-18 tracking-[-0.8px] text-figma-text-1">
                Kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area (Quick Add) */}
      <div className="flex-1 flex flex-col pt-[14px] relative z-0 overflow-clip">
        <h3 className="text-[clamp(14px,5.25vw,24px)] font-bold font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-primary ml-[23px] mb-[15px]">
          Quick Add
        </h3>

        <div className="flex flex-col gap-[15px] w-full relative">
          {/* Item 1: Running */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[423px] h-20 bg-[linear-gradient(90deg,_rgba(255,255,255,1.00)_26%,_rgba(213,210,210,1.00)_100%)] rounded-[50px] shadow-[inset_0_0_0_3px_#ffffff] flex items-center justify-between pl-[23px] pr-[20px] ml-[8px]"
          >
            <div className="flex items-center gap-[28px]">
              <div className="rounded-[200px] w-[62px] h-10 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[clamp(14px,5.25vw,24px)] font-bold font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1">
                  Running
                </span>
                <span className="text-figma-20 font-light font-figma-inter leading-figma-24 tracking-[-2.2px] text-figma-text-1 opacity-[0.45] whitespace-nowrap">
                  Approx 600-900 Kcal Per Hour
                </span>
              </div>
            </div>
            <span className="text-[clamp(22px,8.75vw,40px)] font-medium font-figma-inter leading-[1.2] tracking-[-0.11em] text-figma-text-1">
              +
            </span>
          </motion.div>

          {/* Item 2: Weight Training */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[386px] h-18 bg-[linear-gradient(90deg,_rgba(255,255,255,1.00)_0%,_rgba(213,210,210,1.00)_100%)] rounded-[50px] shadow-[inset_0_0_0_3px_#ffffff] opacity-[0.72] flex items-center justify-between pl-[23px] pr-[20px] ml-[27px]"
          >
            <div className="flex items-center gap-[16px]">
              <div className="w-[50px] min-h-[50px] opacity-[0.54] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[clamp(14px,5.25vw,24px)] font-bold font-figma-inter leading-[1.2083] tracking-[-0.05em] text-figma-text-1 opacity-[0.74]">
                  Weight Training
                </span>
                <span className="text-figma-20 font-light font-figma-inter leading-figma-24 tracking-[-2.2px] text-figma-text-1 opacity-[0.33] whitespace-nowrap">
                  Approx 180-600 Kcal Per Hour
                </span>
              </div>
            </div>
            <span className="text-[clamp(22px,8.75vw,40px)] font-medium font-figma-inter leading-[1.2] tracking-[-0.11em] text-figma-text-1 opacity-[0.75]">
              +
            </span>
          </motion.div>

          {/* Item 3: Weight Training (Faded) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-[313px] h-[51px] bg-[linear-gradient(90deg,_rgba(255,255,255,1.00)_0%,_rgba(213,210,210,1.00)_100%)] rounded-[50px] shadow-[inset_0_0_0_3px_#ffffff] opacity-[0.53] flex items-center justify-between pl-[18px] pr-[16px] ml-[clamp(16px,16vw,73px)]"
          >
            <div className="flex items-center gap-[8px]">
              <div className="w-[31px] min-h-[31px] shrink-0" />
              <div className="flex flex-col">
                <span className="text-figma-20 font-bold font-figma-inter leading-figma-24 tracking-[-1.0px] text-figma-text-1 opacity-[0.43]">
                  Weight Training
                </span>
                <span className="text-figma-16 font-light font-figma-inter leading-figma-19 tracking-[-1.8px] text-figma-text-1 opacity-[0.16] whitespace-nowrap">
                  Approx 180-600 Kcal Per Hour
                </span>
              </div>
            </div>
            <span className="text-[clamp(22px,8.75vw,40px)] font-medium font-figma-inter leading-[1.2] tracking-[-0.11em] text-figma-text-1 opacity-[0.41]">
              +
            </span>
          </motion.div>

          {/* Item 4: Bottom Pill Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-[146px] h-[27px] bg-[linear-gradient(90deg,_rgba(255,255,255,1.00)_0%,_rgba(213,210,210,1.00)_100%)] rounded-[50px] opacity-[0.62] ml-[clamp(24px,34.4vw,157px)] mt-[7px]"
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[87.7%] max-w-[401px] min-h-[89px] z-50 flex items-center justify-between">
        <div className="relative w-[76.8%] min-h-[62px]">
          <img
            className="absolute inset-0 w-full h-full object-cover rounded-[45px]"
            src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/10e91688a_e9b33bc7a_1001_104.svg"
            alt="Nav Background"
          />
          <div className="absolute top-0 left-[25%] w-[19%] min-h-[62px] bg-figma-muted-2 rounded-[45px] z-10" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[10.4%] w-[31px] min-h-[30px] overflow-clip z-20 flex items-center justify-center">
            <img className="w-[26px] h-7" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/62da24d94_48e2f9f37_1001_105_7758_11736.svg" alt="Home Icon" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 left-[30.8%] w-[26px] min-h-[35px] z-20 flex flex-col items-center justify-end">
            <div className="bg-figma-primary rounded-[12px] w-5 min-h-[7px] mb-[-2px] z-10" />
            <div className="bg-figma-primary rounded-[7px] w-[26px] min-h-[31px] z-0" />
          </div>
        </div>
        <div className="relative w-[18.2%] aspect-square max-w-[73px] max-h-[70px]">
          <img className="w-full h-full object-contain" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9fb9de74d_b0d5a2577_1001_100.svg" alt="Add Button Background" />
          <img
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26px] h-[25px] z-10"
            src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/26d4357aa_aa8656ae6_1001_101.svg"
            alt="Plus Icon Layer 1"
          />
          <img
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26px] h-[25px] z-20"
            src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/2230db21d_7f6594ab0_1001_102.svg"
            alt="Plus Icon Layer 2"
          />
        </div>
      </div>
    </main>
  );
}
