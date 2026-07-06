import React from "react";
import { motion } from "framer-motion";

export default function Frame84() {
  return (
    <main className="max-w-[527px] w-full mx-auto relative min-h-[961px] bg-black overflow-clip flex flex-col font-figma-sf-pro">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full pt-[31px] px-6 flex justify-start relative z-20"
      >
        <button className="w-[47px] h-[46px] relative flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-figma-border-5 rounded-[200px] z-0 transition-transform duration-300 group-hover:scale-105" />
          <img className="w-[21px] h-[15px] relative z-10" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/5f1210131_d6cfe5fe1_610_55.svg" alt="Back" />
        </button>
      </motion.div>

      {/* Title Group */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-[11px] flex flex-col items-center w-full relative z-20"
      >
        <div className="relative w-full max-w-[477px] min-h-[118px] flex justify-center">
          {/* Text Shadow Layer */}
          <p className="absolute top-[3px] left-[calc(50%+2px)] -translate-x-1/2 text-[clamp(53px,18.22vw,96px)] font-[590] leading-[1.1979] tracking-[-0.0104em] text-figma-text-1 whitespace-nowrap z-0">
            Nutrition
          </p>
          {/* Main Text Layer */}
          <p className="absolute top-0 left-1/2 -translate-x-1/2 text-[clamp(53px,18.22vw,96px)] font-[590] leading-[1.1979] tracking-[-0.0104em] text-figma-primary whitespace-nowrap z-10">
            Nutrition
          </p>
        </div>
        <p className="text-[clamp(26px,9.11vw,48px)] font-[590] leading-[1.1875] tracking-[-0.0104em] text-figma-primary mt-2">
          Scanner
        </p>
      </motion.div>

      {/* Analyse Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-[clamp(35px,26.6vw,140px)] w-full px-[clamp(16px,7.2vw,38px)] flex justify-center relative z-20"
      >
        <button className="relative w-full max-w-[372px] h-[57px] flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-figma-highlight-4 shadow-[0px_4px_100px_13px_rgba(17,48,255,0.54)] rounded-[200px] opacity-[0.78] z-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative z-10 text-[clamp(18px,6.07vw,32px)] font-[590] leading-[1.1875] tracking-[-0.0094em] text-figma-primary">
            Analyse
          </span>
        </button>
      </motion.div>

      {/* Pagination / Loading Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="mt-[clamp(16px,7.4vw,39px)] flex justify-center items-center gap-1.5 relative z-20"
      >
        <div className="bg-figma-text-1 rounded-[26px] w-[21px] h-3.5" />
        <div className="bg-figma-text-1 rounded-[26px] w-3 h-3.5" />
        <div className="bg-figma-text-1 rounded-[26px] w-3 h-3.5" />
        <div className="bg-figma-text-1 rounded-[26px] w-3 h-3.5" />
        <div className="bg-figma-text-1 rounded-[26px] w-3 h-3.5" />
        <div className="bg-figma-text-1 rounded-[26px] w-3 h-3.5" />
      </motion.div>

      {/* Recent Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-[13px] w-full px-5 flex flex-col relative z-20 flex-1"
      >
        <p className="text-[clamp(26px,9.11vw,48px)] font-[590] leading-[1.1875] tracking-[-0.0104em] text-figma-text-1 opacity-[0.6] ml-1 mb-[14px]">
          <span className="text-[clamp(18px,6.07vw,32px)]">Recent</span>
        </p>

        {/* Tabs */}
        <div className="bg-figma-muted-4 rounded-[62px] w-full max-w-[404px] min-h-[54px] mx-auto flex items-center justify-between px-2 relative">
          <button className="relative flex-1 h-full flex items-center justify-center cursor-pointer">
            <div className="absolute w-[91px] min-h-[46px] bg-figma-surface-5 rounded-[62px] z-0" />
            <span className="relative z-10 text-[clamp(14px,4.55vw,24px)] font-[590] leading-[1.2083] tracking-[-0.0083em] text-figma-primary">
              Food
            </span>
          </button>
          <button className="flex-1 h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80">
            <span className="text-[clamp(14px,4.55vw,24px)] font-[590] leading-[1.2083] tracking-[-0.0083em] text-figma-primary">
              Skincare
            </span>
          </button>
          <button className="flex-1 h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80">
            <span className="text-[clamp(14px,4.55vw,24px)] font-[590] leading-[1.2083] tracking-[-0.0083em] text-figma-primary">
              Supplement
            </span>
          </button>
        </div>

        {/* Stacked List */}
        <div className="mt-[19px] flex flex-col items-center gap-[4px] w-full pb-8">
          {/* Item 1 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative w-full max-w-[386px] h-[73px] flex items-center justify-between px-[15px] cursor-pointer"
          >
            <div className="absolute inset-0 bg-figma-primary rounded-[200px] opacity-[0.74] z-0" />
            <div className="relative z-10 flex items-center gap-[23px]">
              <div className="bg-figma-primary rounded-[14px] w-[71px] min-h-[66px] shadow-sm" />
              <p className="text-[clamp(18px,6.07vw,32px)] font-[590] leading-[0.9688] tracking-[-0.0094em] text-figma-text-1 opacity-[0.6]">
                Coconut Water
              </p>
            </div>
            <p className="relative z-10 text-[clamp(20px,6.83vw,36px)] font-[590] leading-[1.1944] tracking-[-0.0111em] text-figma-text-1-3 mr-[13px]">
              99
            </p>
          </motion.div>

          {/* Item 2 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative w-full max-w-[370px] h-[72px] flex items-center justify-between px-[15px] cursor-pointer"
          >
            <div className="absolute inset-0 bg-figma-primary rounded-[200px] opacity-[0.74] z-0" />
            <div className="relative z-10 flex items-center gap-[20px]">
              <div className="bg-figma-primary rounded-[14px] w-[67px] min-h-[60px] shadow-sm" />
              <p className="text-[clamp(18px,6.07vw,32px)] font-[590] leading-[1.1875] tracking-[-0.0094em] text-figma-text-1 opacity-[0.6]">
                Banana
              </p>
            </div>
            <p className="relative z-10 text-[clamp(20px,6.83vw,36px)] font-[590] leading-[1.1944] tracking-[-0.0111em] text-figma-text-1-3 mr-[18px]">
              90
            </p>
          </motion.div>

          {/* Item 3 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative w-full max-w-[319px] h-[63px] flex items-center justify-between px-[15px] cursor-pointer"
          >
            <div className="absolute inset-0 bg-figma-primary rounded-[200px] opacity-[0.74] z-0" />
            <div className="relative z-10 flex items-center gap-[16px]">
              <div className="bg-figma-primary rounded-[14px] w-[52px] min-h-[52px] shadow-sm" />
              <p className="text-[clamp(18px,6.07vw,32px)] font-[590] leading-[1.1875] tracking-[-0.0094em] text-figma-text-1 opacity-[0.6]">
                Apple
              </p>
            </div>
            <p className="relative z-10 text-[clamp(20px,6.83vw,36px)] font-[590] leading-[1.1944] tracking-[-0.0111em] text-figma-text-1-3 mr-[10px]">
              80
            </p>
          </motion.div>

          {/* Item 4 (Perspective Base) */}
          <div className="relative w-full max-w-[236px] min-h-[37px]">
            <div className="absolute inset-0 bg-figma-primary rounded-[200px] opacity-[0.74] z-0" />
          </div>
        </div>
      </motion.div>
    </main>
  );
}
