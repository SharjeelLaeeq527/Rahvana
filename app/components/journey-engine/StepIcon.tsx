import React from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileCheck,
  Flag,
  Heart,
  IdCard,
  Languages,
  BookOpen,
  FileText,
  Scroll,
  ShieldCheck,
  Home,
  User,
  ExternalLink,
  Globe,
  Scale,
  Edit3,
  HelpCircle,
  FolderOpen,
  Save,
  MessageSquare,
  Calculator,
  Receipt,
  Banknote,
  Building,
  Building2,
  Landmark,
  Wallet,
  HardDrive,
  ClipboardList,
  Mail,
  Briefcase,
  Camera,
  Activity,
  Syringe,
  Hospital,
  Copy,
  Truck,
  Stethoscope,
  Book,
} from "lucide-react";

export const getStepIcon = (iconKey: string, size = 18, className?: string) => {
  switch (iconKey.toLowerCase()) {
    case "passport":
      return <BookOpen size={size} className={className} />;
    case "birth":
      return <FileText size={size} className={className} />;
    case "marriage":
      return <Scroll size={size} className={className} />;
    case "divorce":
      return <Scroll size={size} className={className} />;
    case "pcc":
    case "police":
      return <ShieldCheck size={size} className={className} />;
    case "military":
      return <ShieldCheck size={size} className={className} />;
      case "shield-check":
        return <ShieldCheck size={size} className={className} />;
    case "home":
      return <Home size={size} className={className} />;
    case "user":
      return <User size={size} className={className} />;
    case "link":
      return <ExternalLink size={size} className={className} />;
    case "id":
      return <User size={size} className={className} />;
    case "translations":
      return <Globe size={size} className={className} />;
    case "prior-marriage":
      return <Scale size={size} className={className} />;
    case "death-cert":
      return <FileText size={size} className={className} />;
    case "name-change":
      return <Edit3 size={size} className={className} />;
    case "help":
      return <HelpCircle size={size} className={className} />;
    case "folder":
      return <FolderOpen size={size} className={className} />;
    case "save":
      return <Save size={size} className={className} />;
    case "message":
      return <MessageSquare size={size} className={className} />;
    case "calculator":
      return <Calculator size={size} className={className} />;
    case "receipt":
      return <Receipt size={size} className={className} />;
    case "banknote":
      return <Banknote size={size} className={className} />;
    case "building":
      return <Building size={size} className={className} />;
    case "building2":
      return <Building2 size={size} className={className} />;
    case "landmark":
      return <Landmark size={size} className={className} />;
    case "wallet":
      return <Wallet size={size} className={className} />;
    case "hard-drive":
      return <HardDrive size={size} className={className} />;
    case "file-text":
      return <FileText size={size} className={className} />;
    case "clipboard":
      return <ClipboardList size={size} className={className} />;
    case "mail":
      return <Mail size={size} className={className} />;
    case "briefcase":
      return <Briefcase size={size} className={className} />;
    case "camera":
    case "photos":
      return <Camera size={size} className={className} />;
    case "medical":
    case "pulse":
      return <Activity size={size} className={className} />;
    case "syringe":
    case "polio":
      return <Syringe size={size} className={className} />;
    case "hospital":
      return <Hospital size={size} className={className} />;
    case "copy":
      return <Copy size={size} className={className} />;
    case "truck":
      return <Truck size={size} className={className} />;
    case "stethoscope":
      return <Stethoscope size={size} className={className} />;
    case "book":
      return <Book size={size} className={className} />;
    case "badge-check":
      return <BadgeCheck size={size} className={className} />;
    case "briefcase-business":
      return <BriefcaseBusiness size={size} className={className} />;
    case "file-check":
      return <FileCheck size={size} className={className} />;
    case "flag":
      return <Flag size={size} className={className} />;
    case "heart":
      return <Heart size={size} className={className} />;
    case "id-card":
      return <IdCard size={size} className={className} />;
    case "languages":
      return <Languages size={size} className={className} />;
    default:
      return null;
  }
};
