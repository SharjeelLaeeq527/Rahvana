"use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { MapPinned, PlayCircle } from "lucide-react";
// import Link from "next/link";
import { useState } from "react";
// import RoadmapModal from "@/app/components/IR-pathway-roadmap/RoadmapModal";
import JourneyRouteMap from "./components/JourneyRouteMap";
import ExploreJourneys from "./components/ExploreJourneys";
import { Suspense } from "react";

// ✅ Props type for item rows
// type IRItem = {
//   title: string;
//   description: string;
//   videoLabel: string;
//   roadmapLabel: string;
//   wizardLink: string;
// };

// ✅ Main component
export default function IRCategorySection() {
  // Modal state
  // const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  // const [activeRoadmap, setActiveRoadmap] = useState({ title: "" });
  const [selectedOrigin, setSelectedOrigin] = useState<string>("Pakistan");
  const [selectedDestination, setSelectedDestination] = useState<string>("United States");

  // IR Category items
  // const items: IRItem[] = [
  //   {
  //     title: "IR-1",
  //     description:
  //       "This category applies to the spouse of a U.S. citizen. The process involves documentation, sponsorship, and consular interview steps. Our guide helps you every step of the way.",
  //     videoLabel: "Watch IR-1 Explainer Video",
  //     roadmapLabel: "View IR-1 Roadmap",
  //     wizardLink: "/visa-category/ir-category/ir1-journey",
  //   },
  //   {
  //     title: "IR-5",
  //     description:
  //       "The IR-5 visa is for parents of U.S. citizens aged 21 or older. We simplify the complex process by explaining each form, eligibility requirement, and timeline clearly.",
  //     videoLabel: "Watch IR-5 Explainer Video",
  //     roadmapLabel: "View IR-5 Roadmap",
  //     wizardLink: "/visa-category/ir-category/ir5-journey",
  //   },
  // ];

  // const handleOpenRoadmap = (title: string) => {
  //   setActiveRoadmap({ title });
  //   setIsRoadmapOpen(true);
  // };

  return (
    <section id="ir-category" className="container mx-auto px-6 py-20">
      <JourneyRouteMap
        selectedOrigin={selectedOrigin}
        setSelectedOrigin={setSelectedOrigin}
        selectedDestination={selectedDestination}
        setSelectedDestination={setSelectedDestination}
      />

      <Suspense fallback={<div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg" />}>
        <ExploreJourneys
          origin={selectedOrigin}
          destination={selectedDestination}
        />
      </Suspense>

      {/* <RoadmapModal
        open={isRoadmapOpen}
        onOpenChange={setIsRoadmapOpen}
        title={`${activeRoadmap.title} Roadmap`}
      /> */}

      {/* Hidden anchors (optional for scroll links) */}
      <div id="consultancy" className="sr-only">
        Consultancy section anchor
      </div>
      <div id="contact" className="sr-only">
        Contact section anchor
      </div>
    </section>
  );
}

// ✅ Reusable Item Row component
// function IRItemRow({
//   title,
//   description,
//   videoLabel,
//   roadmapLabel,
//   wizardLink,
//   onViewRoadmap,
// }: IRItem & { onViewRoadmap: () => void }) {
//   return (
//     <div className="grid md:grid-cols-2 gap-8 items-start">
//       {/* Left: Text content */}
//       <div className="space-y-5">
//         <Card className="border-blue-100 hover:shadow-lg transition-all duration-200">
//           <CardContent className="p-6">
//             <div className="text-2xl font-semibold text-primary/90">
//               {title}
//             </div>
//             <p className="mt-3 text-gray-600 leading-relaxed">{description}</p>
//           </CardContent>
//         </Card>

//         <Button
//           onClick={onViewRoadmap}
//           className="gap-2 bg-primary/90 hover:bg-primary text-white rounded-md shadow-md"
//         >
//           <MapPinned className="h-4 w-4" />
//           {roadmapLabel}
//         </Button>
//         <Button
//           asChild
//           className="gap-2 bg-primary/90 ml-4 px-8 hover:bg-primary text-white rounded-md shadow-md"
//         >
//           <Link href={wizardLink}>
//             <PlayCircle className="h-4 w-4" />
//             Start Journey
//           </Link>
//         </Button>
//       </div>

//       {/* Right: Video placeholder */}
//       <Card className="hover:shadow-lg border-primary/20 transition-all duration-200">
//         <CardContent className="p-4">
//           <div
//             className="aspect-21/9 w-full rounded-md bg-linear-to-br from-gray-100 to-blue-50 grid place-items-center text-sm text-gray-500"
//             aria-label={`${title} explainer video placeholder`}
//           >
//             <div className="flex flex-col items-center gap-2">
//               <PlayCircle
//                 className="h-8 w-8 text-blue-500"
//                 aria-hidden="true"
//               />
//               <span className="font-medium">{videoLabel}</span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
