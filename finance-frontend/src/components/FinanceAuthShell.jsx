import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, ShieldCheck, WalletCards } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";

const shellContent = {
  login: {
    heading: "Finance Connect",
    description:
      "Sign in to access your finance dashboard, review income and expenses, and manage secure role-based access for your team.",
    captionTitle: "Workspace snapshot",
    captionItems: ["Income overview", "Expense tracking", "Secure team access"],
  },
  register: {
    heading: "Finance Connect",
    description:
      "Create your account to enter a modern finance workspace with clean dashboards, controlled access, and better money visibility.",
    captionTitle: "What you unlock",
    captionItems: ["Viewer account access", "Category-wise insights", "Safer finance workflows"],
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function DotMap() {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { theme } = useTheme();

  const routes = [
    {
      start: { x: 88, y: 154, delay: 0 },
      end: { x: 196, y: 84, delay: 2 },
      color: theme === "dark" ? "#3b82f6" : "#2563eb",
    },
    {
      start: { x: 196, y: 84, delay: 2 },
      end: { x: 266, y: 128, delay: 4 },
      color: theme === "dark" ? "#60a5fa" : "#3b82f6",
    },
    {
      start: { x: 56, y: 54, delay: 1 },
      end: { x: 156, y: 186, delay: 3 },
      color: theme === "dark" ? "#38bdf8" : "#2563eb",
    },
    {
      start: { x: 286, y: 64, delay: 0.5 },
      end: { x: 184, y: 190, delay: 2.5 },
      color: theme === "dark" ? "#818cf8" : "#4f46e5",
    },
  ];

  const generateDots = (width, height) => {
    const dots = [];
    const gap = 12;
    const dotRadius = 1;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const isInShape =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4 && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8 && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3) && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.72 && x > width * 0.45) && (y < height * 0.5 && y > height * 0.1)) ||
          ((x < width * 0.82 && x > width * 0.66) && (y < height * 0.82 && y > height * 0.62));

        if (isInShape && Math.random() > 0.3) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.5 + 0.1,
          });
        }
      }
    }

    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) {
      return undefined;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const dots = generateDots(dimensions.width, dimensions.height);
    const dotColor = theme === "dark" ? "255, 255, 255" : "37, 99, 235";
    const glowColor = theme === "dark" ? "#60a5fa" : "#3b82f6";
    const glowColorRgb = theme === "dark" ? "96, 165, 250" : "59, 130, 246";
    let animationFrameId;
    let startTime = Date.now();

    function drawDots() {
      context.clearRect(0, 0, dimensions.width, dimensions.height);

      dots.forEach((dot) => {
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${dotColor}, ${dot.opacity})`;
        context.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;

      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;

        if (elapsed <= 0) {
          return;
        }

        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        context.beginPath();
        context.moveTo(route.start.x, route.start.y);
        context.lineTo(x, y);
        context.strokeStyle = route.color;
        context.lineWidth = 1.5;
        context.stroke();

        context.beginPath();
        context.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        context.fillStyle = route.color;
        context.fill();

        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fillStyle = glowColor;
        context.fill();

        context.beginPath();
        context.arc(x, y, 6, 0, Math.PI * 2);
        context.fillStyle = `rgba(${glowColorRgb}, 0.28)`;
        context.fill();

        if (progress === 1) {
          context.beginPath();
          context.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          context.fillStyle = route.color;
          context.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();

      if ((Date.now() - startTime) / 1000 > 15) {
        startTime = Date.now();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, routes, theme]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function FinanceBadgeRow({ items }) {
  const icons = [WalletCards, Landmark, ShieldCheck];

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => {
        const Icon = icons[index] || WalletCards;

        return (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.55 + index * 0.1 }}
            className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-200">
              <Icon size={18} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-white/80">{item}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function FinanceAuthShell({
  variant = "login",
  mobileTitle,
  formEyebrow,
  formTitle,
  formDescription,
  children,
  footer,
}) {
  const content = shellContent[variant];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f5f9ff] via-white to-[#edf4ff] p-4 dark:from-[#060818] dark:to-[#0d1023]">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div className="flex h-full w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_32px_80px_rgba(15,23,42,0.12)] dark:border-[#1f2130] dark:bg-[#090b13] dark:text-white"
        >
          <div className="relative hidden h-[600px] w-1/2 overflow-hidden border-r border-slate-200 bg-gradient-to-br from-[#eef5ff] to-[#dfeafc] dark:border-[#1f2130] dark:from-[#0f1120] dark:to-[#151929] md:block">
            <DotMap />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-500"
              >
                {content.heading}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="max-w-xs text-sm leading-6 text-slate-600 dark:text-gray-400"
              >
                {content.description}
              </motion.p>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-5 text-left shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/45">
                    {content.captionTitle}
                  </p>
                  <FinanceBadgeRow items={content.captionItems} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full p-8 md:w-1/2 md:p-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-6 md:hidden">
                <p className="text-sm uppercase tracking-[0.38em] text-slate-500 dark:text-gray-400">Finance Suite</p>
                <h2 className="mt-3 text-3xl font-bold">{mobileTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-400">{content.description}</p>
              </div>

              <p className="text-sm uppercase tracking-[0.38em] text-slate-500 dark:text-gray-400">{formEyebrow}</p>
              <h1 className="mb-1 mt-3 text-3xl font-bold">{formTitle}</h1>
              <p className="mb-8 text-sm leading-6 text-slate-600 dark:text-gray-400">{formDescription}</p>

              {children}

              {footer ? <div className="mt-6 text-center text-sm text-slate-600 dark:text-gray-400">{footer}</div> : null}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
