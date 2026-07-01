import React from "react";
import { motion } from "framer-motion";

export default function Frame32() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-zinc-950 p-4 sm:p-8">
      {/*
        Using a fluid aspect-ratio container with percentage-based absolute positioning
        to perfectly preserve the "poster" layout fidelity across all screen sizes.
      */}
      <div className="relative w-full max-w-[489px] aspect-[489/972] mx-auto overflow-clip rounded-[40px] shadow-2xl bg-black">

        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-clip">
          <motion.img
            src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/a5b576513_d9be0168f_67ec5c8e6977d0cbaef966754bccad720c2b178a.png"
            alt="Mountain Landscape"
            className="w-full h-full object-cover object-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Header: Scanly Logo */}
        <div className="absolute top-[1.337%] left-[5.726%] w-[30.061%] h-[6.378%] z-[5]">
          <motion.p
            className="w-full h-full text-[clamp(29px,10.63vw,52px)] font-normal font-figma-sf-pro leading-[1.1923] text-figma-primary flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            Scanly
          </motion.p>
        </div>

        {/* Header: Fire Badge */}
        <div className="absolute top-[2.983%] left-[78.527%] w-[10.429%] h-[4.321%] z-[2]">
          <motion.div
            className="relative w-full h-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/5ddbaf066_fce239ce5_763_21.svg"
              alt="Badge Background"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <p className="absolute top-[21.4%] left-[15.6%] text-[clamp(14px,4.91vw,24px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 flex items-center justify-center">
              🔥
            </p>
            <p className="absolute top-[16.6%] left-[66.6%] text-[clamp(14px,4.91vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary flex items-center justify-center">
              1
            </p>
          </motion.div>
        </div>

        {/* Main Content: Overview Text */}
        <div className="absolute top-[21.810%] left-[12.065%] w-[78.527%] h-[11.111%] z-[16]">
          <motion.p
            className="w-full h-full text-[clamp(50px,18.4vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 flex items-center justify-center text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          >
            Overview
          </motion.p>
        </div>

        {/* Main Content: 80 Metric */}
        <div className="absolute top-[47.119%] left-[35.582%] w-[30.470%] h-[15.740%] z-[15]">
          <motion.p
            className="w-full h-full text-[clamp(70px,26.18vw,128px)] font-normal font-heading leading-[1.1953] text-figma-primary flex items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
          >
            80
          </motion.p>
        </div>

        {/* Pagination Dots */}
        <div className="absolute top-[70.267%] left-[43.967%] w-[12.065%] h-[1.028%] z-[11]">
          <motion.div
            className="w-full h-full flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <div className="bg-figma-primary rounded-[26px] w-[27.11%] h-full mr-[11.86%]" />
            <div className="bg-figma-primary rounded-[26px] w-[16.94%] h-full mr-[5.08%]" />
            <div className="bg-figma-primary rounded-[26px] w-[16.94%] h-full mr-[5.08%]" />
            <div className="bg-figma-primary rounded-[26px] w-[16.94%] h-full" />
          </motion.div>
        </div>

        {/* Footer: Navigation Pill Background */}
        <div className="absolute top-[89.711%] left-[7.157%] w-[65.439%] h-[6.893%] z-[7]">
          <motion.div
            className="w-full h-full relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/1b389fab2_a6ef2d975_777_154.svg"
              alt="Navigation Background"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </motion.div>
        </div>

        {/* Footer: Home Button */}
        <div className="absolute top-[89.711%] left-[9.815%] w-[13.496%] h-[6.893%] z-[8]">
          <motion.button
            className="w-full h-full bg-figma-secondary rounded-[45px] flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Home"
          >
            <img
              src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/317b7642d_367fb4826_777_156.svg"
              alt="Home Icon"
              className="w-[40.9%] h-[44.7%] object-contain"
            />
          </motion.button>
        </div>

        {/* Footer: Add Button */}
        <div className="absolute top-[88.991%] left-[75.664%] w-[16.768%] h-[7.613%] z-[6]">
          <motion.button
            className="w-full h-full relative flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new item"
          >
            <img
              src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/37c4dc2db_4ea0b569a_763_52.svg"
              alt="Add Button Background"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <span className="absolute top-[12.16%] left-[30.48%] w-[39.02%] h-[83.78%] z-[9] text-[clamp(29px,10.63vw,52px)] font-normal font-figma-sf-pro leading-[1.1923] text-figma-text-1 flex items-center justify-center">
              +
            </span>
          </motion.button>
        </div>

      </div>
    </main>
  );
}
