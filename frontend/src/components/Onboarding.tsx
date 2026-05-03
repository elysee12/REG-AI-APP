import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Bell, CheckCircle2 } from "lucide-react";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const steps = [
    {
      title: "Welcome to GRIDGuard AI",
      description: "Advanced AI-powered monitoring to protect Rwanda's power infrastructure from vandalism and theft.",
      icon: <Shield className="w-16 h-16 text-primary" />,
      color: "from-primary/20 to-transparent",
    },
    {
      title: "Real-time Alerts",
      description: "Receive instant notifications when suspicious activity is detected near critical power units.",
      icon: <Bell className="w-16 h-16 text-primary" />,
      color: "from-blue-500/20 to-transparent",
    },
    {
      title: "National Grid Protection",
      description: "Helping the Rwanda Energy Group (REG) ensure stable power delivery through intelligent security.",
      icon: <Zap className="w-16 h-16 text-primary" />,
      color: "from-yellow-500/20 to-transparent",
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-8 sm:p-12 overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square max-w-lg bg-gradient-to-br ${currentStep.color} rounded-full blur-[100px] transition-all duration-700 opacity-60`} />

      <div className="w-full flex justify-end">
        <Button variant="ghost" onClick={onComplete} className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          Skip
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-md animate-in fade-in zoom-in duration-500">
        <div className="p-8 rounded-[2.5rem] bg-white shadow-2xl border border-gray-100 mb-4">
          {currentStep.icon}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tight text-[#1a1a1a]">
            {currentStep.title}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {currentStep.description}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex justify-center gap-2">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step ? "w-8 bg-primary" : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={nextStep}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-xl font-black rounded-2xl shadow-xl shadow-primary/25 transition-all active:scale-[0.98] uppercase tracking-wider"
        >
          {step === totalSteps ? (
            <span className="flex items-center gap-2">
              Get Started <CheckCircle2 className="w-5 h-5" />
            </span>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
