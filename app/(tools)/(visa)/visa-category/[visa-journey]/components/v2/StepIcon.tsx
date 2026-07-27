import React from "react";
import {
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
} from "lucide-react";

export const getStepIcon = (iconKey: string) => {
  switch (iconKey) {
    case "passport":
      return <BookOpen size={18} />;
    case "birth":
      return <FileText size={18} />;
    case "marriage":
      return <Scroll size={18} />;
    case "divorce":
      return <Scroll size={18} />;
    case "pcc":
    case "police":
      return <ShieldCheck size={18} />;
    case "military":
      return <ShieldCheck size={18} />;
    case "home":
      return <Home size={18} />;
    case "user":
      return <User size={18} />;
    case "link":
      return <ExternalLink size={18} />;
    case "id":
      return <User size={18} />;
    case "translations":
      return <Globe size={18} />;
    case "prior-marriage":
      return <Scale size={18} />;
    case "death-cert":
      return <FileText size={18} />;
    case "name-change":
      return <Edit3 size={18} />;
    case "help":
      return <HelpCircle size={18} />;
    case "folder":
      return <FolderOpen size={18} />;
    case "save":
      return <Save size={18} />;
    case "message":
      return <MessageSquare size={18} />;
    case "calculator":
      return <Calculator size={18} />;
    case "receipt":
      return <Receipt size={18} />;
    case "banknote":
      return <Banknote size={18} />;
    case "building":
      return <Building size={18} />;
    case "landmark":
      return <Landmark size={18} />;
    case "wallet":
      return <Wallet size={18} />;
    case "hard-drive":
      return <HardDrive size={18} />;
    case "file-text":
      return <FileText size={18} />;
    case "clipboard":
      return <ClipboardList size={18} />;
    case "mail":
      return <Mail size={18} />;
    case "briefcase":
      return <Briefcase size={18} />;
    case "camera":
    case "photos":
      return <Camera size={18} />;
    case "medical":
    case "pulse":
      return <Activity size={18} />;
    case "syringe":
    case "polio":
      return <Syringe size={18} />;
    case "hospital":
    case "medical":
      return <Hospital size={18} />;
    case "copy":
      return <Copy size={18} />;
    case "truck":
      return <Truck size={18} />;
    default:
      return null;
  }
};
