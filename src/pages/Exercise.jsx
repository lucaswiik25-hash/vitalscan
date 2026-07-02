const MainScreen = () => {
  return (
    <div className="w-full relative flex items-start pt-[0rem] px-[0.062rem] pb-[4.937rem] box-border leading-[normal] tracking-[normal]">
      <main className="flex-1 flex items-start py-[0rem] pl-[0rem] pr-[0.937rem] box-border max-w-full">
        <section className="flex-1 flex flex-col items-center relative isolate gap-[3.625rem] max-w-[27.444rem] z-[0] text-left text-[1.5rem] text-[#000] font-[Inter] mq439:max-w-full">
          <section className="self-stretch rounded-[62px] bg-[#fff] flex flex-col items-center py-[1.25rem] pl-[0.25rem] pr-[0.625rem] box-border relative isolate gap-[2.812rem] max-w-full z-[9] shrink-0 text-left text-[1.5rem] text-[#000] font-[Inter]">
            <div className="w-[7.813rem] h-[2.313rem] absolute !!m-[0 important] top-[0.875rem] left-[calc(50%_-_62.25px)] rounded-[104px] bg-[#000] z-[0] shrink-0" />
            <div className="self-stretch flex flex-col items-end py-[1.937rem] px-[0rem] box-border gap-[2.562rem] max-w-full z-[1] shrink-0 mq424:gap-[1.25rem]">
              <div className="w-[4.869rem] h-[2.688rem] flex items-start py-[0rem] px-[1rem] box-border">
                <div className="h-[2.688rem] w-[2.813rem] rounded-[200px] bg-[#d9d9d9] flex items-center justify-center">
                  <h3 className="m-0 relative text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] inline-block min-w-[1.5rem] mq450:text-[1.188rem]">
                    AI
                  </h3>
                </div>
              </div>
              <div className="self-stretch flex items-start flex-wrap content-start gap-[0.5rem] max-w-full">
                <h3 className="m-0 flex-1 relative text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] inline-block min-w-[8.313rem] max-w-full mq450:text-[1.188rem]">{`Todays Burn `}</h3>
                <button className="cursor-pointer [border:none] pt-[0.25rem] px-[1.437rem] pb-[0.312rem] bg-[#000] h-[1.75rem] rounded-[50px] flex items-center justify-center box-border hover:bg-[#333]">
                  <b className="relative text-[1rem] tracking-[-0.05em] font-[Inter] text-[#fff] text-left">
                    Log
                  </b>
                </button>
              </div>
            </div>
            <img
              className="cursor-pointer [border:none] p-0 bg-[transparent] w-[2.563rem] h-[2.5rem] absolute !!m-[0 important] top-[3.188rem] left-[1.706rem] z-[2] shrink-0"
              alt=""
              src="/Home.svg"
            />
            <div className="w-[calc(100%_+_0.9px)] h-[0.063rem] absolute !!m-[0 important] top-[6.969rem] right-[0.081rem] left-[-0.137rem] border-[#000] border-solid border-t-[1px] box-border opacity-[0.24] z-[3] shrink-0" />
            <div className="w-[16.106rem] h-[10.5rem] relative z-[4] shrink-0 text-[6.75rem] text-[#c1d5e1]">
              <h2 className="m-0 absolute top-[2.313rem] left-[1.875rem] text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit]">
                70%
              </h2>
              <h1 className="m-0 absolute top-[2.313rem] left-[1.438rem] text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] text-[#000]">
                70%
              </h1>
            </div>
            <div className="self-stretch flex items-start justify-center flex-wrap content-start py-[0rem] pl-[0.937rem] pr-[1rem] gap-x-[1.937rem] gap-y-[0.625rem] z-[5] shrink-0 mq421:gap-[0.938rem]">
              <div className="flex-1 flex flex-col items-center py-[0rem] pl-[0rem] pr-[1.125rem] box-border gap-[0.125rem] min-w-[7.25rem] max-w-[7.438rem] mq450:max-w-full mq439:flex-1">
                <h3 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.05em] font-medium font-[inherit] mq450:text-[1.188rem]">{`Exercises `}</h3>
                <h2 className="m-0 relative text-[2.5rem] tracking-[-0.05em] font-light font-[inherit] inline-block min-w-[1.563rem]">
                  2
                </h2>
              </div>
              <div className="flex-[1.1783] flex flex-col items-center gap-[0.125rem] min-w-[6.125rem] max-w-[6.188rem] mq450:max-w-full">
                <h3 className="m-0 w-full relative text-[length:inherit] tracking-[-0.05em] font-medium font-[inherit] inline-block max-w-[5.438rem] mq450:text-[1.188rem]">{`Burned `}</h3>
                <div className="flex items-end gap-[0.25rem] text-[2.5rem]">
                  <h2 className="m-0 relative text-[length:inherit] tracking-[-0.05em] font-light font-[inherit]">
                    250
                  </h2>
                  <div className="h-[1.556rem] flex items-start pt-[0rem] px-[0rem] pb-[0.431rem] box-border text-[0.938rem]">
                    <div className="relative tracking-[-0.05em] font-medium">
                      Kcal
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-[1.1783] flex flex-col items-start gap-[0.062rem] min-w-[6.75rem] max-w-[6.875rem] mq450:max-w-full">
                <h3 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.05em] font-medium font-[inherit] mq450:text-[1.188rem]">{`Remaining `}</h3>
                <div className="self-stretch flex items-end justify-end py-[0rem] px-[0.062rem] gap-[0.187rem] text-[2.5rem]">
                  <h2 className="m-0 relative text-[length:inherit] tracking-[-0.05em] font-light font-[inherit] inline-block min-w-[4.375rem]">
                    350
                  </h2>
                  <div className="h-[1.431rem] flex items-start pt-[0rem] px-[0rem] pb-[0.306rem] box-border text-[0.938rem]">
                    <div className="relative tracking-[-0.05em] font-medium">
                      Kcal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div className="w-[6.25rem] h-[6.25rem] absolute !!m-[0 important] top-[calc(50%_-_110px)] left-[-0.106rem] [filter:blur(100px)] rounded-[200px] bg-[#ea234b] opacity-[0.14] z-[10] shrink-0" />
          <div className="w-[6.25rem] h-[6.25rem] absolute !!m-[0 important] top-[calc(50%_-_99px)] right-[-1.012rem] [filter:blur(100px)] rounded-[200px] bg-[#0095ff] opacity-[0.15] z-[11] shrink-0" />
          <h3 className="!!m-[0 important] absolute top-[calc(50%_+_124px)] left-[1.331rem] text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] text-[#fff] inline-block min-w-[6.938rem] z-[2] shrink-0 mq450:text-[1.188rem]">{`Quick Add `}</h3>
          <div className="w-full flex items-start py-[0rem] pl-[0rem] pr-[0.187rem] box-border max-w-[26.675rem] z-[12] shrink-0 mq427:max-w-full">
            <div className="h-[5rem] flex-1 rounded-[50px] [background:linear-gradient(90deg,_#fff_25.96%,_#d5d2d2)] border-[#fff] border-solid border-[3px] box-border flex items-center justify-center pt-[0.5rem] pb-[0.506rem] pl-[1.25rem] pr-[1.062rem] gap-[1.618rem] max-w-full mq354:flex-wrap">
              <img
                className="w-[3.875rem] relative rounded-[200px] max-h-full object-cover"
                loading="lazy"
                alt=""
                src="/running-icon-1@2x.png"
              />
              <div className="flex-1 flex flex-col items-start pt-[0rem] px-[0rem] pb-[0.306rem] box-border isolate min-w-[9.688rem] z-[0]">
                <h3 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] z-[1] mq450:text-[1.188rem]">{`Running `}</h3>
                <h3 className="m-0 self-stretch relative text-[1.25rem] tracking-[-0.11em] font-light font-[inherit] whitespace-pre-wrap opacity-[0.45] z-[2] mt-[-0.063rem] mq450:text-[1rem]">{`Approx  600-900 Kcal Per Hour `}</h3>
              </div>
              <button className="cursor-pointer [border:none] p-0 bg-[transparent] w-[1.688rem] relative text-[2.5rem] tracking-[-0.11em] font-medium font-[Inter] text-[#000] text-left inline-block">
                +
              </button>
            </div>
          </div>
          <div className="w-[24.125rem] h-[4.5rem] absolute !!m-[0 important] bottom-[6.75rem] left-[calc(50%_-_194.25px)] rounded-[50px] [background:linear-gradient(90deg,_#fff,_#d5d2d2)] border-[#fff] border-solid border-[3px] box-border opacity-[0.72] z-[5] shrink-0" />
          <h3 className="!!m-[0 important] absolute bottom-[8.75rem] left-[calc(50%_-_105.25px)] text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] opacity-[0.74] z-[6] shrink-0 mq450:text-[1.188rem]">{`Weight Training `}</h3>
          <button className="cursor-pointer [border:none] p-0 bg-[transparent] w-[1.688rem] absolute !!m-[0 important] right-[2.988rem] bottom-[7.563rem] text-[2.5rem] tracking-[-0.11em] font-medium font-[Inter] text-[#000] text-left inline-block opacity-[0.75] z-[14] shrink-0">
            +
          </button>
          <img
            className="w-[3.125rem] absolute !!m-[0 important] bottom-[7.438rem] left-[3.019rem] max-h-full object-cover z-[16] shrink-0"
            loading="lazy"
            alt=""
            src="/Weights-ikon-1@2x.png"
          />
          <h3 className="!!m-[0 important] absolute bottom-[7.188rem] left-[calc(50%_-_106.25px)] text-[1.25rem] tracking-[-0.11em] font-light font-[inherit] whitespace-pre-wrap opacity-[0.33] z-[17] shrink-0 mq450:text-[1rem]">{`Approx  180-600 Kcal Per Hour `}</h3>
          <footer className="self-stretch flex flex-col items-center py-[3rem] px-[1.125rem] isolate z-[13] shrink-0 text-left text-[1.25rem] text-[#000] font-[Inter]">
            <h3 className="m-0 w-full relative text-[length:inherit] tracking-[-0.05em] font-bold font-[inherit] inline-block opacity-[0.43] max-w-[13.194rem] z-[1] mq450:text-[1rem]">{`Weight Training `}</h3>
            <div className="w-full relative text-[1rem] tracking-[-0.11em] font-light whitespace-pre-wrap inline-block opacity-[0.16] max-w-[13.194rem] z-[2] mt-[-0.188rem]">{`Approx  180-600 Kcal Per Hour `}</div>
          </footer>
          <div className="w-[19.563rem] h-[3.188rem] absolute !!m-[0 important] bottom-[2.688rem] left-[calc(50%_-_148.25px)] rounded-[50px] [background:linear-gradient(90deg,_#fff,_#d5d2d2)] border-[#fff] border-solid border-[3px] box-border opacity-[0.53] z-[4] shrink-0" />
          <button className="cursor-pointer [border:none] p-0 bg-[transparent] w-[1.688rem] absolute !!m-[0 important] right-[4.425rem] bottom-[2.875rem] text-[2.5rem] tracking-[-0.11em] font-medium font-[Inter] text-[#000] text-left inline-block opacity-[0.41] z-[15] shrink-0">
            +
          </button>
          <img
            className="cursor-pointer [border:none] p-0 bg-[transparent] w-[1.938rem] h-[1.938rem] absolute !!m-[0 important] bottom-[3.313rem] left-[5.581rem] object-contain z-[3] shrink-0"
            alt=""
            src="/jump-rope-icon-1@2x.png"
          />
          <div className="w-[9.125rem] h-[1.688rem] absolute !!m-[0 important] bottom-[0.563rem] left-[calc(50%_-_64.25px)] rounded-[50px] [background:linear-gradient(90deg,_#fff,_#d5d2d2)] opacity-[0.62] z-[8] shrink-0" />
          <img
            className="w-[25.075rem] h-[5.55rem] absolute !!m-[0 important] bottom-[-4.425rem] left-[calc(50%_-_191.25px)] z-[7] shrink-0"
            loading="lazy"
            alt=""
            src="/Group-34.svg"
          />
          <img
            className="w-[27.438rem] h-[calc(100%_+_79px)] absolute !!m-[0 important] top-[60.313rem] bottom-[-65.25rem] left-[27.331rem] [filter:blur(0px)] rounded-[64px] max-h-full object-cover z-[1] shrink-0"
            alt=""
            src="/iPhone-17-Pro-Max@2x.png"
          />
        </section>
      </main>
    </div>
  );
};

export default MainScreen;
