import React from "react";
import { motion } from "framer-motion";

export default function Frame3() {
  return (
    <main className="max-w-[447px] w-full mx-auto relative flex flex-col items-center pb-10">
      {/* Top Card */}
      <div className="relative w-[98.2%] aspect-[439/599] rounded-[105px] bg-[#e7edf1] overflow-clip shadow-sm">
        {/* Blurred Background Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="bg-figma-primary [filter:blur(100px)] rounded-[105px] w-[55.8%] h-[45.9%] opacity-[0.21] absolute top-0 left-[21.8%]" />
          <div className="bg-figma-border-4 [filter:blur(100px)] rounded-[105px] w-[79%] h-[26.2%] opacity-[0.21] absolute top-[22.8%] left-[10.9%]" />
          <div className="bg-figma-surface-4 [filter:blur(100px)] rounded-[105px] w-[101.8%] h-[41.5%] opacity-[0.21] absolute top-[37.5%] left-0" />
        </div>

        {/* Content Layer */}
        <div className="absolute inset-0 z-10">
          {/* 3780 */}
          <div className="absolute top-[34%] w-full flex justify-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-[clamp(70px,28.64vw,128px)] font-normal font-figma-inter leading-[1.2109] text-figma-text-1 text-center"
            >
              3780
            </motion.p>
          </div>

          {/* of */}
          <div className="absolute top-[53.6%] w-full flex justify-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-[clamp(35px,14.32vw,64px)] font-normal font-figma-inter leading-[1.2031] text-figma-text-1 text-center"
            >
              of
            </motion.p>
          </div>

          {/* 4000 */}
          <div className="absolute top-[60.9%] w-full flex justify-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-[clamp(53px,21.48vw,96px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 text-center"
            >
              4000
            </motion.p>
          </div>

          {/* Log Button */}
          <div className="absolute top-[83.8%] w-full flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-figma-primary rounded-[134px] w-[71%] aspect-[312/86] flex items-center justify-center"
            >
              <span className="text-[clamp(35px,14.32vw,64px)] font-normal font-figma-inter leading-[1.2031] text-figma-text-1">
                Log
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Chart Section */}
      <div className="w-[94.4%] mt-[15px] flex flex-col gap-y-[10px]">
        <p className="text-[clamp(22px,8.95vw,40px)] font-normal font-figma-inter leading-[1.2] text-figma-text-1 ml-[2.5%]">
          7- Days
        </p>

        <div className="grid grid-cols-5 w-full gap-0">
          {[
            { height: "73.8%" }, // 110 / 149
            { height: "81.8%" }, // 122 / 149
            { height: "66.4%" }, // 99 / 149
            { height: "100%" },  // 149 / 149
            { height: "79.8%" }, // 119 / 149
          ].map((bar, i) => (
            <div key={i} className="w-full aspect-[84/149] relative flex items-end justify-center">
              {/* Background Track */}
              <div className="absolute inset-0 w-[95%] mx-auto bg-figma-text-1 rounded-[71px]" />

              {/* Animated Fill */}
              <div className="relative w-[95%] mx-auto h-full flex items-end z-10">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: bar.height }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1, delay: i * 0.1, type: "spring", bounce: 0.2 }}
                  className="w-full bg-figma-secondary-2 rounded-[71px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
