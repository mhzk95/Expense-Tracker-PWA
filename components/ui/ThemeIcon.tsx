"use client";

import React, { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Target, 
  BarChart3, 
  Wallet, 
  BookImage, 
  Settings, 
  Menu,
  Home,
  FileText,
  MoreHorizontal
} from "lucide-react";

type IconName = 
  | "nav-home" 
  | "nav-transactions" 
  | "nav-journal" 
  | "nav-research" 
  | "nav-more"
  | "action-add"
  | "action-settings";

interface ThemeIconProps {
  name: IconName;
  className?: string;
  [key: string]: any;
}

// Temporary SVGs for the new themes - we will flesh these out in Slice 6.
const FootballPitchSVG = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <circle cx="12" cy="12" r="3" />
    <path d="M2 9v6" />
    <path d="M22 9v6" />
  </svg>
);

const SoccerBallSVG = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20" />
    <path d="M2 12h20" />
  </svg>
);

const TacticBoardSVG = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
    <path d="M7 8h10" />
    <path d="M7 12h10" />
    <path d="M7 16h10" />
    <circle cx="6" cy="12" r="1" fill="currentColor" />
  </svg>
);

const NotepadSVG = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export function ThemeIcon({ name, className, ...props }: ThemeIconProps) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Read theme from DOM attribute to sync perfectly with Next.js/React hydration
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
    
    return () => observer.disconnect();
  }, []);

  const isFootballTheme = ["argentina", "brazil", "france", "germany"].includes(theme);

  // Return specific icon based on active theme
  if (isFootballTheme) {
    switch (name) {
      case "nav-home": return <FootballPitchSVG className={className} {...props} />;
      case "nav-transactions": return <SoccerBallSVG className={className} {...props} />;
      case "nav-journal": return <NotepadSVG className={className} {...props} />;
      case "nav-research": return <TacticBoardSVG className={className} {...props} />;
      case "nav-more": return <MoreHorizontal className={className} {...props} />;
      default: break; // Fallback to classic
    }
  }

  // Classic fallback mapping
  switch (name) {
    case "nav-home": return <LayoutDashboard className={className} {...props} />;
    case "nav-transactions": return <ArrowLeftRight className={className} {...props} />;
    case "nav-journal": return <BookImage className={className} {...props} />;
    case "nav-research": return <Target className={className} {...props} />;
    case "nav-more": return <Menu className={className} {...props} />;
    case "action-add": return <Wallet className={className} {...props} />;
    case "action-settings": return <Settings className={className} {...props} />;
    default: return null;
  }
}
