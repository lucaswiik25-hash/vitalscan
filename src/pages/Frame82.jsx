import React from "react";
import { motion } from "framer-motion";

export default function SupplementsScreen() {
  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
  };

  return (
    <main className="relative w-full max-w-[531px] aspect-[531/961] mx-auto overflow-clip bg-transparent">
      {/* Background Gradient */}
      <div className="absolute top-0 left-[7.15%] w-[82.67%] h-full bg-[linear-gradient(180deg,_rgba(77,98,123,1.00)_0%,_rgba(245,245,245,1.00)_100%)] rounded-[64px] z-0" />

      {/* Background Blur Layer */}
      <div className="absolute top-[0.3%] left-[7.15%] w-[83%] h-[99.7%] rounded-[64px] [filter:blur(100px)] z-[-1]">
        <div className="absolute top-[-2.3%] left-[-5.6%] w-[111%] min-h-[104%] z-[1]" />
      </div>

      {/* Decorative Artifact */}
      <div className="absolute top-[2.6%] left-[15.81%] w-[4.51%] h-[2.18%] overflow-clip z-[4]" />

      {/* Header Title */}
      <motion.p
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-[6.55%] left-[10.17%] w-[55%] h-[4.47%] text-[clamp(26px,9.04vw,48px)] font-normal font-figma-sf-pro leading-[1.1875] text-figma-primary z-10"
      >
        Supplements
      </motion.p>

      {/* Cards Scatter Collage Container */}
      <div className="absolute top-[17.37%] left-0 w-full h-[73.46%] z-20">

        {/* Top Card (Night C-vitamin) */}
        <div className="absolute top-[0%] left-[7.15%] w-[83.05%] h-[37.25%] z-10 -rotate-[6deg]">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative w-full h-full"
          >
            {/* Shadow Layer */}
            <div className="absolute top-[11.4%] left-[4.3%] w-[92.97%] h-[78.32%] bg-figma-surface-3 rounded-[78px] z-[1]" />
            {/* Main Card Layer */}
            <div className="absolute top-[10.26%] left-[2.72%] w-[92.29%] h-[74.52%] bg-figma-primary rounded-[78px] z-[2]" />

            {/* Image Placeholder */}
            <div className="absolute top-[8.74%] left-[7.02%] w-[40.36%] h-[66.15%] bg-figma-primary rounded-[52px] z-[5]" />
            <div className="absolute top-[8.36%] left-[12.69%] w-[20.86%] h-[66.92%] z-[6]" />

            {/* Typography */}
            <p className="absolute top-[17.11%] left-[58.73%] w-[23.35%] h-[15.2%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[12]">
              Night
            </p>
            <p className="absolute top-[33.84%] left-[52.15%] w-[36.5%] h-[14.06%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[15]">
              C-vitamin
            </p>
            <p className="absolute top-[45.24%] left-[62.81%] w-[10.43%] h-[10.64%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[16]">
              2x
            </p>

            {/* Action Button */}
            <button className="absolute top-[55.89%] left-[31.74%] w-[29.7%] h-[19.77%] bg-figma-accent-2 rounded-[49px] z-[20] hover:opacity-90 transition-opacity active:scale-95" />
            <p className="absolute top-[59.31%] left-[38.77%] w-[18.36%] h-[15.2%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-text-1 z-[21] pointer-events-none flex items-center justify-center">
              Take
            </p>
          </motion.div>
        </div>

        {/* Middle Card (Morning Creatine) */}
        <div className="absolute top-[30.59%] left-[2.63%] w-[89.64%] h-[33.71%] z-20 rotate-[12deg]">
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative w-full h-full"
          >
            {/* Shadow Layer */}
            <div className="absolute top-[34.45%] left-[11.97%] w-[89.07%] h-[100.84%] bg-figma-subtle rounded-[78px] z-[1]" />
            {/* Main Card Layer */}
            <div className="absolute top-[34.87%] left-[10.08%] w-[88.02%] h-[97.05%] bg-figma-color-9 rounded-[78px] z-[2]" />

            {/* Image Placeholder */}
            <div className="absolute top-[22.68%] left-[10.29%] w-[38.65%] h-[71.42%] bg-figma-primary rounded-[52px] z-[22]" />
            <div className="absolute top-[25.63%] left-[17.64%] w-[24.15%] h-[64.7%] z-[23]" />

            {/* Typography */}
            <p className="absolute top-[3.78%] left-[46.21%] w-[36.13%] h-[16.38%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[24]">
              Morning
            </p>
            <p className="absolute top-[18.9%] left-[52.1%] w-[27.52%] h-[11.34%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[25]">
              Creatine
            </p>
            <p className="absolute top-[34.03%] left-[61.13%] w-[7.56%] h-[13.02%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[26]">
              1x
            </p>
            <p className="absolute top-[28.57%] left-[69.11%] w-[13.02%] h-[13.02%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[27]">
              5g
            </p>

            {/* Action Button */}
            <button className="absolute top-[48.31%] left-[60.71%] w-[27.94%] h-[21.0%] bg-figma-accent-2 rounded-[49px] z-[28] hover:opacity-90 transition-opacity active:scale-95" />
            <p className="absolute top-[50.84%] left-[67.85%] w-[17.43%] h-[16.38%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-primary z-[29] pointer-events-none flex items-center justify-center">
              Take
            </p>
          </motion.div>
        </div>

        {/* Bottom Card (Morning Ksm 66) */}
        <div className="absolute top-[58.35%] left-[7.72%] w-[85.49%] h-[36.82%] z-30 rotate-0">
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative w-full h-full"
          >
            {/* Shadow Layer */}
            <div className="absolute top-[31.92%] left-[12.11%] w-[85.24%] h-[62.69%] bg-figma-border-3 rounded-[78px] z-[1]" />
            {/* Main Card Layer */}
            <div className="absolute top-[31.53%] left-[9.91%] w-[85.02%] h-[58.84%] bg-figma-highlight-3 rounded-[78px] z-[2]" />

            {/* Image Placeholder */}
            <div className="absolute top-[15.76%] left-[9.69%] w-[36.56%] h-[68.46%] bg-figma-primary rounded-[52px] z-[4]" />
            <div className="absolute top-[19.61%] left-[16.74%] w-[22.9%] h-[60.76%] z-[7]" />

            {/* Typography */}
            <p className="absolute top-[14.61%] left-[51.32%] w-[34.8%] h-[15.76%] text-[clamp(22px,7.53vw,40px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[13]">
              Morning
            </p>
            <p className="absolute top-[29.61%] left-[57.04%] w-[25.33%] h-[12.69%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[14]">
              Ksm 66
            </p>
            <p className="absolute top-[41.53%] left-[65.63%] w-[8.14%] h-[12.69%] text-[clamp(18px,6.03vw,32px)] font-normal font-figma-inter leading-[1.2188] text-figma-text-1 z-[17]">
              2x
            </p>

            {/* Action Button */}
            <button className="absolute top-[60.0%] left-[57.7%] w-[28.41%] h-[20.0%] bg-figma-accent-2 rounded-[49px] z-[18] hover:opacity-90 transition-opacity active:scale-95" />
            <p className="absolute top-[64.61%] left-[64.75%] w-[17.4%] h-[15.76%] text-[clamp(18px,6.03vw,32px)] font-normal font-heading leading-[1.1875] text-figma-primary z-[19] pointer-events-none flex items-center justify-center">
              Take
            </p>
          </motion.div>
        </div>

        {/* Pagination Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="absolute inset-0 z-40 pointer-events-none"
        >
          <div className="absolute top-[92.35%] left-[42.93%] w-[3.01%] h-[1.13%] bg-figma-text-1 rounded-[26px] z-[8]" />
          <div className="absolute top-[92.35%] left-[47.26%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px] z-[9]" />
          <div className="absolute top-[92.35%] left-[49.71%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px] z-[11]" />
          <div className="absolute top-[92.35%] left-[52.16%] w-[1.88%] h-[1.13%] bg-figma-text-1 rounded-[26px] z-[10]" />
        </motion.div>
      </div>
    </main>
  );
}
