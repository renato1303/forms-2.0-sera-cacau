import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, BarChart3, Binary, Compass, Cpu } from 'lucide-react';

interface LoaderProps {
  onComplete: () => void;
}

export default function LoaderStep({ onComplete }: LoaderProps) {
  const steps = [
    { text: 'Avaliando cenário da empresa...', icon: Cpu, progressRange: [0, 25], color: 'text-[#C88452]' },
    { text: 'Identificando gargalos de crescimento...', icon: BarChart3, progressRange: [25, 55], color: 'text-[#C88452]' },
    { text: 'Cruzando informações da operação...', icon: Compass, progressRange: [55, 85], color: 'text-[#C88452]' },
    { text: 'Preparando diagnóstico comercial...', icon: ShieldCheck, progressRange: [85, 100], color: 'text-[#C88452]' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Total duration exactly 2100ms
    const totalDuration = 2100;
    const intervalTime = 30;
    const totalSteps = totalDuration / intervalTime;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const currentProgress = Math.min(Math.round((stepCount / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress < 25) {
        setCurrentStepIndex(0);
      } else if (currentProgress < 55) {
        setCurrentStepIndex(1);
      } else if (currentProgress < 85) {
        setCurrentStepIndex(2);
      } else {
        setCurrentStepIndex(3);
      }

      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  const CurrentIcon = steps[currentStepIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full max-w-2xl dark-glass-panel rounded-[28px] sm:rounded-[32px] p-8 md:p-12 shadow-2xl border border-white/10 select-none text-white">
      <div className="relative flex items-center justify-center mb-8 w-40 h-40">
        
        {/* Soft, clean background waves with minimal scaling */}
        <div className="absolute inset-0 border border-white/10 rounded-full animate-ping pointer-events-none opacity-20" />
        <div className="absolute inset-10 border border-white/15 rounded-full animate-pulse pointer-events-none opacity-25" />

        {/* Clean, high-contrast Progress Arc */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            className="stroke-white/10 fill-none"
            strokeWidth="4"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            className="stroke-white fill-none"
            strokeWidth="4"
            strokeDasharray={439.8} // 2 * pi * 70
            strokeDashoffset={439.8 - (439.8 * progress) / 100}
            transition={{ ease: 'easeOut' }}
          />
        </svg>

        {/* Percentage Counter */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.div
            key={currentStepIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mb-1 text-white"
          >
            <CurrentIcon className="w-8 h-8" />
          </motion.div>
          <span className="font-display font-medium text-3xl tracking-tight text-white mb-0.5">
            {progress}%
          </span>
          <span className="text-[10px] tracking-widest text-[#C88452] font-mono font-bold uppercase">
            CALIBRANDO
          </span>
        </div>
      </div>

      {/* Steps description list */}
      <div className="h-10 text-center w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-base md:text-lg font-display text-neutral-200 tracking-wide font-medium"
          >
            {steps[currentStepIndex].text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Primary loading bar */}
      <div className="w-64 h-[4px] bg-white/10 rounded-full overflow-hidden mt-6 border border-white/15">
        <div 
          className="h-full bg-gradient-to-r from-[#C88452] to-[#E09D6C] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Standard security indicators */}
      <div className="mt-14 flex items-center justify-center gap-6 text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-1.5 bg-white/[0.04] px-3.5 py-1.5 border border-white/10 rounded-full">
          <Binary className="w-3.5 h-3.5 text-[#C88452]" />
          <span>SERÁ_CACAU_B2B</span>
        </div>
        <div className="text-white/20 select-none">•</div>
        <div className="flex items-center gap-1.5 bg-white/[0.04] px-3.5 py-1.5 border border-white/10 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C88452]" />
          <span>GARANTIA DE PRIVACIDADE</span>
        </div>
      </div>
    </div>
  );
}
