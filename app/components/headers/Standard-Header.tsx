interface StandardHeaderProps {
    title: string; 
    subtitle?: string;

}
export default function ResourceHeader({title, subtitle}: StandardHeaderProps){
    return (
        <div>
            <h1 className="mx-auto text-center max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--rahvana-primary-dark)] sm:text-5xl lg:text-7xl">
                {title}
            </h1>
            {!!subtitle && 
                <p className="mt-3 text-muted-foreground text-base md: text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms] hidden md:block">
                    {subtitle}
                </p>
            }
        </div> 
        );

    
}



