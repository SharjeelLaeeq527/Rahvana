import { ReactNode } from "react";

type HeaderCategory = "navSections" | "journeyPathwayChapter";

interface HeaderProps {
    title: string; 
    category: HeaderCategory;
    children?: ReactNode;
    centered?: boolean;
    fullWidth?: boolean;
    noTopPadding?: boolean;

    

}

const styles: Record<HeaderCategory, string> = {
        //include different styling for each category type
        navSections: "text-4xl font-bold tracking-[-0.04em] text-[var(--rahvana-primary-dark)] sm:text-5xl lg:text-7xl",
        journeyPathwayChapter: "text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl"
    };


export default function Header({category, title, children, centered = false, fullWidth = false, noTopPadding = false}: HeaderProps){
    let headerStyle = styles[category];

    if (!fullWidth && category === "navSections") {
        headerStyle += " max-w-4xl";
    }

    if (centered) {
        headerStyle += " mx-auto text-center";
    }


    const wrapperClasses = [
        noTopPadding ? "pt-0 mt-0" : "pt-30", 
        centered ? "flex flex-col items-center text-center" : "text-left"
    ].join(" ");

    return (
        <header className={wrapperClasses}>
            <h1 className={headerStyle}>
                {title}
            </h1>
            {children}
        </header>
    )

    
}



