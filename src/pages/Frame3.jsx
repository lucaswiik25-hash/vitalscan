import React from "react";
import { motion } from "framer-motion";

export default function ScanlyDashboard() {
  return (
    <main className="w-full min-h-screen bg-black flex items-center justify-center p-4 md:p-8 overflow-clip">
      <div className="w-full max-w-[2425px] mx-auto grid grid-cols-1 md:grid-cols-[489fr_191fr_489fr_138fr_489fr_140fr_489fr] gap-8 md:gap-0">

        {/* Panel 1 */}
        <div className="col-span-1 md:col-start-1 relative w-full aspect-[489/972] rounded-[40px] overflow-clip shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute inset-0 w-full h-full"
          >
            <img className="absolute inset-0 w-full h-full z-[0]" style={{ objectFit: "cover", objectPosition: "center" }} src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9c0e3fa91_c41712942_67ec5c8e6977d0cbaef966754bccad720c2b178a.png" alt="Background 1" />

            <p className="absolute top-[1.34%] left-[5.73%] w-[30.06%] h-[6.38%] text-[clamp(29px,2.14vw,52px)] font-normal font-figma-sf-pro leading-[1.1923] text-figma-primary z-[7]">Scanly</p>

            <div className="absolute top-[2.98%] left-[78.53%] w-[10.43%] h-[4.32%] z-[4]">
              <img className="absolute inset-0 w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/a84dd7830_bebcca614_763_21.svg" alt="Pill" />
            </div>
            <p className="absolute top-[3.91%] left-[80.16%] w-[4.91%] h-[2.47%] text-[clamp(14px,0.99vw,24px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 z-[6]">🔥</p>
            <p className="absolute top-[3.70%] left-[85.48%] w-[1.84%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[5]">1</p>

            <p className="absolute top-[21.81%] left-[12.07%] w-[78.53%] h-[11.11%] text-[clamp(50px,3.71vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[18]">Overview</p>

            <div className="absolute top-[36.11%] left-[8.79%] w-[85.07%] h-[42.70%] bg-figma-primary rounded-[50%] z-[1]" />
            <div className="absolute top-[36.11%] left-[8.79%] w-[85.07%] h-[42.70%] bg-figma-highlight rounded-[50%] z-[2]" />

            <p className="absolute top-[47.12%] left-[35.58%] w-[30.47%] h-[15.74%] text-[clamp(70px,5.28vw,128px)] font-normal font-heading leading-[1.1953] text-figma-primary z-[17]">80</p>

            <div className="absolute top-[70.27%] left-[43.97%] w-[3.27%] h-[1.03%] bg-figma-primary rounded-[26px] z-[13]" />
            <div className="absolute top-[70.27%] left-[48.67%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[14]" />
            <div className="absolute top-[70.27%] left-[51.33%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[16]" />
            <div className="absolute top-[70.27%] left-[53.99%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[15]" />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="absolute top-[89.71%] left-[7.16%] w-[65.44%] h-[6.89%] z-[9]">
              <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/2443c0e37_2eeebb21c_777_154.svg" alt="Nav Base" />
            </motion.button>
            <div className="absolute top-[89.71%] left-[9.82%] w-[13.50%] h-[6.89%] bg-figma-secondary rounded-[45px] z-[10] pointer-events-none" />
            <img className="absolute top-[91.77%] left-[14.11%] w-[5.52%] h-[3.09%] z-[12] pointer-events-none" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/2d6b0a28f_8dc1ebdf0_777_156.svg" alt="Icon" />

            <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }} className="absolute top-[88.99%] left-[75.66%] w-[16.77%] h-[7.61%] z-[8]">
              <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/375f7409e_e78adf39a_763_52.svg" alt="Add Button" />
              <p className="absolute inset-0 flex items-center justify-center text-[clamp(29px,2.14vw,52px)] font-normal font-figma-sf-pro leading-[1.1923] text-figma-text-1 z-[11] pb-1">+</p>
            </motion.button>
          </motion.div>
        </div>

        {/* Gap 1 */}
        <div className="hidden md:block md:col-start-2" />

        {/* Panel 2 */}
        <div className="col-span-1 md:col-start-3 relative w-full aspect-[489/972] rounded-[40px] overflow-clip shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            viewport={{ once: true }}
            className="absolute inset-0 w-full h-full"
          >
            <img className="absolute inset-0 w-full h-full z-[0]" style={{ objectFit: "cover", objectPosition: "center" }} src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9c0e3fa91_c41712942_67ec5c8e6977d0cbaef966754bccad720c2b178a.png" alt="Background 2" />

            <p className="absolute top-[5.76%] left-[9.61%] w-[29.65%] h-[5.97%] text-[clamp(26px,1.98vw,48px)] font-normal font-heading leading-[1.2083] text-figma-primary opacity-[0.59] z-[8]">Scanly</p>

            <div className="absolute top-[7.41%] left-[78.32%] w-[10.43%] h-[4.32%] z-[5]">
              <img className="absolute inset-0 w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/af7a79bb9_bbb065765_764_101.svg" alt="Pill" />
            </div>
            <p className="absolute top-[8.33%] left-[79.96%] w-[4.91%] h-[2.47%] text-[clamp(14px,0.99vw,24px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 z-[7]">🔥</p>
            <p className="absolute top-[8.13%] left-[85.28%] w-[1.84%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[6]">1</p>

            <p className="absolute top-[28.60%] left-[32.11%] w-[36.40%] h-[11.11%] text-[clamp(50px,3.71vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[3]">Kcal</p>
            <p className="absolute top-[28.60%] left-[32.11%] w-[36.40%] h-[11.11%] text-[clamp(50px,3.71vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[4]">Kcal</p>

            <div className="absolute top-[37.65%] left-[4.70%] w-[85.89%] h-[42.90%] rounded-[42px] z-[1]">
              <div className="absolute top-[0.48%] left-[0%] w-[99.05%] h-[99.52%] bg-[#9fc2ce] rounded-[50%] z-[2]" />
              <div className="absolute top-[0%] left-[0.24%] w-[99.05%] h-[99.52%] bg-figma-surface rounded-[50%] z-[1]" />
            </div>

            <img className="absolute top-[50.93%] left-[9.82%] w-[1px] h-[1px] z-[15]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/973d009d0_cfe6e47e4_764_97.svg" alt="Line" />

            <p className="absolute top-[47.53%] left-[24.34%] w-[55.21%] h-[15.74%] text-[clamp(70px,5.28vw,128px)] font-normal font-heading leading-[1.1953] text-figma-primary z-[13]">1300</p>

            <div className="absolute top-[61.83%] left-[41.72%] w-[20.45%] h-[0.62%] bg-figma-primary rounded-[26px] z-[16]" />
            <p className="absolute top-[62.45%] left-[46.63%] w-[10.63%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[14]">2450</p>

            <div className="absolute top-[69.14%] left-[45.60%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[10]" />
            <div className="absolute top-[69.14%] left-[48.47%] w-[3.68%] h-[1.03%] bg-figma-primary rounded-[26px] z-[9]" />
            <div className="absolute top-[69.14%] left-[52.76%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[12]" />
            <div className="absolute top-[69.14%] left-[55.42%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[11]" />

            <div className="absolute top-[86.63%] left-[8.79%] w-[83.44%] h-[7.61%] z-[17]">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="absolute top-[5.41%] left-[0%] w-[78.43%] h-[90.54%] z-[0]">
                <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/e0b9ef592_50fc567d6_777_161.svg" alt="Nav Base" />
              </motion.button>
              <div className="absolute top-[9.46%] left-[3.19%] w-[16.18%] h-[90.54%] bg-figma-secondary rounded-[45px] z-[5] pointer-events-none" />

              <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }} className="absolute top-[0%] left-[79.90%] w-[20.10%] h-[100%] z-[2]">
                <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/3bd735c55_3f5988d13_777_162.svg" alt="Add Button" />
                <div className="absolute top-[22.97%] left-[25.05%] w-[48.80%] h-[54.05%] overflow-clip z-[4] pointer-events-none">
                  <img className="absolute top-[20%] left-[20%] w-[67.5%] h-[67.5%] z-[1]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/8222bf05a_6e117f477_777_164_7758_12109.svg" alt="Icon" />
                </div>
              </motion.button>

              <div className="absolute top-[31.08%] left-[7.35%] w-[7.84%] h-[43.24%] overflow-clip z-[3] pointer-events-none">
                <img className="absolute top-[9.38%] left-[12.5%] w-[84.38%] h-[93.75%] z-[1]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/e2260ff0e_e601f95d7_777_163_7758_11736.svg" alt="Icon" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gap 2 */}
        <div className="hidden md:block md:col-start-4" />

        {/* Panel 3 */}
        <div className="col-span-1 md:col-start-5 relative w-full aspect-[489/972] rounded-[40px] overflow-clip shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="absolute inset-0 w-full h-full"
          >
            <img className="absolute inset-0 w-full h-full z-[2]" style={{ objectFit: "cover", objectPosition: "center" }} src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9c0e3fa91_c41712942_67ec5c8e6977d0cbaef966754bccad720c2b178a.png" alt="Background 3" />

            <p className="absolute top-[5.76%] left-[9.82%] w-[29.65%] h-[5.97%] text-[clamp(26px,1.98vw,48px)] font-normal font-heading leading-[1.2083] text-figma-primary opacity-[0.59] z-[7]">Scanly</p>

            <div className="absolute top-[7.41%] left-[78.53%] w-[10.43%] h-[4.32%] z-[4]">
              <img className="absolute inset-0 w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/2fa181cc1_4b73f10d8_764_128.svg" alt="Pill" />
            </div>
            <p className="absolute top-[8.33%] left-[80.16%] w-[4.91%] h-[2.47%] text-[clamp(14px,0.99vw,24px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 z-[6]">🔥</p>
            <p className="absolute top-[8.13%] left-[85.48%] w-[1.84%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[5]">1</p>

            <p className="absolute top-[29.63%] left-[20.86%] w-[62.58%] h-[9.98%] text-[clamp(50px,3.71vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[3]">Protein</p>

            <div className="absolute top-[39.61%] left-[8.18%] w-[85.07%] h-[42.70%] bg-figma-surface rounded-[50%] z-[12]" />
            <div className="absolute top-[39.61%] left-[8.18%] w-[85.07%] h-[42.70%] bg-[#9fc2ce] rounded-[50%] z-[13]" />

            <img className="absolute top-[50.93%] left-[10.02%] w-[1px] h-[1px] z-[18]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/48053944c_e5e84708e_764_144.svg" alt="Line" />

            <p className="absolute top-[45.99%] left-[35.99%] w-[29.45%] h-[15.74%] text-[clamp(70px,5.28vw,128px)] font-normal font-heading leading-[1.1953] text-figma-primary z-[14]">89</p>

            <p className="absolute top-[55.86%] left-[62.37%] w-[3.27%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[16]">G</p>

            <div className="absolute top-[60.29%] left-[41.92%] w-[20.45%] h-[0.62%] bg-figma-primary rounded-[26px] z-[19]" />
            <p className="absolute top-[60.91%] left-[49.28%] w-[6.75%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[15]">145</p>
            <p className="absolute top-[61.73%] left-[56.03%] w-[2.25%] h-[1.95%] text-figma-16 font-normal font-heading leading-figma-19 text-figma-primary z-[17]">G</p>

            <div className="absolute top-[67.59%] left-[45.81%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[8]" />
            <div className="absolute top-[67.59%] left-[48.67%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[11]" />
            <div className="absolute top-[67.59%] left-[51.33%] w-[3.68%] h-[1.03%] bg-figma-primary rounded-[26px] z-[10]" />
            <div className="absolute top-[67.59%] left-[55.62%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[9]" />

            <div className="absolute top-[90.64%] left-[9.82%] w-[83.44%] h-[7.61%] z-[35]">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="absolute top-[5.41%] left-[0%] w-[78.43%] h-[90.54%] z-[0]">
                <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/314a0ad30_dd3130011_764_132.svg" alt="Nav Base" />
              </motion.button>
              <div className="absolute top-[9.46%] left-[3.19%] w-[16.18%] h-[90.54%] bg-figma-secondary rounded-[45px] z-[5] pointer-events-none" />

              <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }} className="absolute top-[0%] left-[79.90%] w-[20.10%] h-[100%] z-[2]">
                <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/a97cb5a6d_44d7e63c9_764_137.svg" alt="Add Button" />
                <div className="absolute top-[22.97%] left-[25.05%] w-[48.80%] h-[54.05%] overflow-clip z-[4] pointer-events-none">
                  <img className="absolute top-[20%] left-[20%] w-[67.5%] h-[67.5%] z-[1]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/ed07584ce_c499a4e2a_764_139_7758_12109.svg" alt="Icon" />
                </div>
              </motion.button>

              <div className="absolute top-[31.08%] left-[7.35%] w-[7.84%] h-[43.24%] overflow-clip z-[3] pointer-events-none">
                <img className="absolute top-[9.38%] left-[12.5%] w-[84.38%] h-[93.75%] z-[1]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/71f9ea9fc_cb3993094_764_138_7758_11736.svg" alt="Icon" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gap 3 */}
        <div className="hidden md:block md:col-start-6" />

        {/* Panel 4 */}
        <div className="col-span-1 md:col-start-7 relative w-full aspect-[489/972] rounded-[40px] overflow-clip shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute inset-0 w-full h-full"
          >
            <img className="absolute inset-0 w-full h-full z-[1]" style={{ objectFit: "cover", objectPosition: "center" }} src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9c0e3fa91_c41712942_67ec5c8e6977d0cbaef966754bccad720c2b178a.png" alt="Background 4" />

            <p className="absolute top-[3.81%] left-[9.00%] w-[29.65%] h-[5.97%] text-[clamp(26px,1.98vw,48px)] font-normal font-heading leading-[1.2083] text-figma-primary opacity-[0.59] z-[24]">Scanly</p>

            <div className="absolute top-[5.45%] left-[77.71%] w-[10.43%] h-[4.32%] z-[21]">
              <img className="absolute inset-0 w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/db7ced337_c012962f4_764_161.svg" alt="Pill" />
            </div>
            <p className="absolute top-[6.38%] left-[79.35%] w-[4.91%] h-[2.47%] text-[clamp(14px,0.99vw,24px)] font-normal font-figma-inter leading-[1.2083] text-figma-text-1 z-[23]">🔥</p>
            <p className="absolute top-[6.17%] left-[84.66%] w-[1.84%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[22]">1</p>

            <p className="absolute top-[27.06%] left-[25.97%] w-[48.06%] h-[11.11%] text-[clamp(50px,3.71vw,90px)] font-normal font-heading leading-[1.2] text-figma-text-1 z-[20]">Carbs</p>

            <div className="absolute top-[37.65%] left-[6.54%] w-[85.07%] h-[42.70%] bg-[#9fc2ce] rounded-[50%] z-[34]" />
            <div className="absolute top-[37.65%] left-[7.36%] w-[85.07%] h-[42.70%] bg-figma-surface rounded-[50%] z-[31]" />

            <img className="absolute top-[48.97%] left-[9.20%] w-[1px] h-[1px] z-[40]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/9e323ea32_5e161f61a_764_179.svg" alt="Line" />

            <p className="absolute top-[44.14%] left-[32.52%] w-[38.65%] h-[15.74%] text-[clamp(70px,5.28vw,128px)] font-normal font-heading leading-[1.1953] text-figma-primary z-[32]">198</p>

            <p className="absolute top-[54.32%] left-[69.53%] w-[3.27%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[38]">G</p>

            <div className="absolute top-[58.33%] left-[41.10%] w-[20.45%] h-[0.62%] bg-figma-primary rounded-[26px] z-[41]" />
            <p className="absolute top-[58.95%] left-[48.47%] w-[7.98%] h-[2.98%] text-[clamp(14px,0.99vw,24px)] font-normal font-heading leading-[1.2083] text-figma-primary z-[33]">225</p>
            <p className="absolute top-[59.77%] left-[56.44%] w-[2.25%] h-[1.95%] text-figma-16 font-normal font-heading leading-figma-19 text-figma-primary z-[39]">G</p>

            <div className="absolute top-[65.64%] left-[44.99%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[26]" />
            <div className="absolute top-[65.64%] left-[47.85%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[28]" />
            <div className="absolute top-[65.64%] left-[50.72%] w-[2.04%] h-[1.03%] bg-figma-primary rounded-[26px] z-[29]" />
            <div className="absolute top-[65.64%] left-[53.37%] w-[3.48%] h-[1.03%] bg-figma-primary rounded-[26px] z-[27]" />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="absolute top-[89.09%] left-[9.00%] w-[65.44%] h-[6.89%] z-[25]">
              <img className="w-full h-full" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/cd7a081a1_bd7216e85_764_165.svg" alt="Nav Base" />
            </motion.button>
            <div className="absolute top-[89.09%] left-[11.66%] w-[13.50%] h-[6.89%] bg-figma-secondary rounded-[45px] z-[37] pointer-events-none" />
            <div className="absolute top-[91.05%] left-[15.13%] w-[6.54%] h-[3.29%] overflow-clip z-[30] pointer-events-none">
              <img className="absolute top-[9.38%] left-[12.5%] w-[84.38%] h-[93.75%] z-[1]" src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/6ed60ee75_2aadf9d6a_764_171_7758_11736.svg" alt="Icon" />
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
