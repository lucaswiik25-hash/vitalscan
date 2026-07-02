import React from "react";
import { motion } from "framer-motion";

export default function SupplementsTracker() {
  return (
    <main className="max-w-[531px] w-full mx-auto relative aspect-[531/961] min-h-[961px] bg-[linear-gradient(180deg,_rgba(77,98,123,1.00)_0%,_rgba(245,245,245,1.00)_100%)] rounded-[64px] overflow-clip shadow-2xl">
      {/* Background Blur Layer (from raw code) */}
      <div className="absolute inset-0 [filter:blur(100px)] rounded-[64px] pointer-events-none z-0">
        <div className="absolute top-[-2.28%] left-[-4.70%] w-[92.27%] h-[104.05%]" />
      </div>

      {/* Header */}
      <div className="absolute top-[2.60%] left-[15.81%] w-[4.51%] h-[2.18%] overflow-clip z-10" />
      <motion.p
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-[6.55%] left-[10.16%] w-[54.99%] h-[4.47%] text-[clamp(26px,9.04vw,48px)] font-normal font-figma-sf-pro leading-[1.1875] text-figma-primary z-10"
      >
        Supplements
      </motion.p>

      {/* Cards Area */}
      <div className="absolute top-[17.37%] left-0 w-full h-[73.46%] z-20">

        {/* Card 1 (White - "Night") - Bottom of stack visually */}
        <div className="absolute top-[0%] left-[7.15%] w-[83.05%] h-[37.25%] z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
            className="relative w-full h-full"
          >
            {/* Backgrounds */}
            <div className="absolute top-[10.26%] left-[2.72%] w-[92.29%] h-[74.52%] bg-figma-primary rounded-[78px]" />
            <div className="absolute top-[11.40%] left-[4.30%] w-[92.97%] h-[78.32%] bg-figma-surface-3 rounded-[78px]" />

            {/* Image Box */}
            <div className="absolute top-[8.74%] left-[15.64%] w-[40.36%] h-[66.15%] bg-figma-primary rounded-[52px]" />
            <div className="absolute top-[8.36%] left-[21.31%] w-[20.86%] h-[66.92%]" />

            {/* Content */}
            <p className="absolute top-[17.11%] left-[67.34%] w-[23.35%] h-[15.20%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1">Night </p>
            <p className="absolute top-[33.84%] left-[60.77%] w-[36.50%] h-[14.06%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">C-vitamin</p>
            <p className="absolute top-[45.24%] left-[71.42%] w-[10.43%] h-[10.64%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">2x</p>

            {/* Button */}
            <button className="absolute top-[55.89%] left-[40.36%] w-[29.70%] h-[19.77%] bg-figma-accent-2 rounded-[49px] hover:scale-105 transition-transform" />
            <p className="absolute top-[59.31%] left-[47.39%] w-[18.36%] h-[15.20%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-text-1 pointer-events-none">Take</p>
          </motion.div>
        </div>

        {/* Card 3 (Light Purple - "Morning Ksm 66") - Middle of stack visually */}
        <div className="absolute top-[58.35%] left-[7.72%] w-[85.49%] h-[36.82%] z-20">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
            className="relative w-full h-full"
          >
            {/* Backgrounds */}
            <div className="absolute top-[31.53%] left-[9.91%] w-[85.02%] h-[58.84%] bg-figma-highlight-3 rounded-[78px]" />
            <div className="absolute top-[31.92%] left-[12.11%] w-[85.24%] h-[62.69%] bg-figma-border-3 rounded-[78px]" />

            {/* Image Box */}
            <div className="absolute top-[15.76%] left-[9.69%] w-[36.56%] h-[68.46%] bg-figma-primary rounded-[52px]" />
            <div className="absolute top-[19.61%] left-[16.74%] w-[22.90%] h-[60.76%]" />

            {/* Content */}
            <p className="absolute top-[14.61%] left-[51.32%] w-[34.80%] h-[15.76%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1">Morning </p>
            <p className="absolute top-[29.61%] left-[57.04%] w-[25.33%] h-[12.69%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">Ksm 66</p>
            <p className="absolute top-[41.53%] left-[65.63%] w-[8.14%] h-[12.69%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">2x</p>

            {/* Button */}
            <button className="absolute top-[60.00%] left-[57.70%] w-[28.41%] h-[20.00%] bg-figma-accent-2 rounded-[49px] hover:scale-105 transition-transform" />
            <p className="absolute top-[64.61%] left-[64.75%] w-[17.40%] h-[15.76%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-primary pointer-events-none">Take</p>
          </motion.div>
        </div>

        {/* Card 2 (Purple - "Morning Creatine") - Top of stack visually */}
        <div className="absolute top-[30.59%] left-[2.63%] w-[89.64%] h-[33.71%] z-30">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 6 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
            className="relative w-full h-full"
          >
            {/* Backgrounds */}
            <div className="absolute top-[34.87%] left-[10.08%] w-[88.02%] h-[97.05%] bg-figma-color-9 rounded-[78px]" />
            <div className="absolute top-[34.45%] left-[11.97%] w-[89.07%] h-[100.84%] bg-figma-subtle rounded-[78px]" />

            {/* Content */}
            <p className="absolute top-[3.78%] left-[46.21%] w-[36.13%] h-[16.38%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1">Morning </p>

            {/* Image Box */}
            <div className="absolute top-[22.68%] left-[10.29%] w-[38.65%] h-[71.42%] bg-figma-primary rounded-[52px]" />
            <div className="absolute top-[25.63%] left-[17.64%] w-[24.15%] h-[64.70%]" />

            {/* More Content */}
            <p className="absolute top-[18.90%] left-[52.10%] w-[27.52%] h-[11.34%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">Creatine</p>
            <p className="absolute top-[34.03%] left-[61.13%] w-[7.56%] h-[13.02%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">1x</p>
            <p className="absolute top-[28.57%] left-[69.11%] w-[13.02%] h-[13.02%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1">5g</p>

            {/* Button */}
            <button className="absolute top-[48.31%] left-[60.71%] w-[27.94%] h-[21.00%] bg-figma-accent-2 rounded-[49px] hover:scale-105 transition-transform" />
            <p className="absolute top-[50.84%] left-[67.85%] w-[17.43%] h-[16.38%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-primary pointer-events-none">Take</p>
          </motion.div>
        </div>

        {/* Pagination Dots */}
        <div className="absolute top-[92.35%] left-[42.93%] w-[3.01%] h-[1.13%] bg-figma-text-1 rounded-[26px]" />
        <div className="absolute top-[92.35%] left-[47.26%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px]" />
        <div className="absolute top-[92.35%] left-[49.71%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px]" />
        <div className="absolute top-[92.35%] left-[52.16%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px]" />
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute top-[89.48%] left-[11.11%] w-[78.15%] h-[9.98%] z-40"
      >
        {/* Main Pill */}
        <div className="absolute top-[15.62%] left-[0%] w-[77.10%] h-[69.79%]">
          <img className="absolute top-0 left-0 w-full h-full object-cover" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/e3b77a6e7_7025b409b_1005_50.svg" alt="Nav Background" />

          {/* Active Highlight */}
          <div className="absolute top-[0%] left-[24.37%] w-[19.06%] min-h-[100%] bg-figma-muted-2 rounded-[45px]" />

          {/* Bottle Icon (Active) */}
          <div className="absolute top-[20.89%] left-[29.68%] w-[8.43%] h-[56.71%]">
            <div className="absolute top-[0%] left-[11.11%] w-[77.77%] h-[21.05%] bg-figma-primary rounded-[12px]" />
            <div className="absolute top-[13.15%] left-[0%] w-[100%] h-[86.84%] bg-figma-primary rounded-[7px]" />
          </div>

          {/* Home Icon */}
          <div className="absolute top-[25.37%] left-[9.68%] w-[10.00%] h-[47.76%] overflow-clip cursor-pointer hover:opacity-80 transition-opacity">
            <img className="absolute top-[9.37%] left-[12.50%] w-[84.37%] h-[93.75%]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/e6c3b0157_a4e4e3789_1005_51_7758_11736.svg" alt="Home" />
          </div>
        </div>

        {/* Plus Button */}
        <button className="absolute top-[11.45%] left-[79.27%] w-[18.31%] h-[78.12%] hover:scale-105 transition-transform active:scale-95">
          <img className="absolute top-0 left-0 w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/a89c993d3_931c19e91_1005_45.svg" alt="Add Background" />
          <img className="absolute top-[36.00%] left-[35.52%] w-[35.52%] h-[36.00%]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/32d921daf_0594f3105_1005_46.svg" alt="Plus Horizontal" />
          <img className="absolute top-[36.00%] left-[35.52%] w-[35.52%] h-[36.00%]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/cfb9fdc50_db313ec18_1005_47.svg" alt="Plus Vertical" />
        </button>
      </motion.div>
    </main>
  );
}
