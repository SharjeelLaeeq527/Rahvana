"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ComingSoonModal } from "../shared/ComingSoonModal";
import { Instagram, Facebook, Linkedin, ArrowRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const handleNav = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const routes: Record<string, string> = {
      contact: "/#contact",
      about: "/#about",
    };

    const targetRoute = routes[id] || "/";
    router.push(targetRoute);
  };

  // Hide footer on admin, login and signup pages
  if (
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    // Return minimal footer for admin or null for auth
    if (pathname?.startsWith("/admin")) {
      return <footer className="bg-background mt-20"></footer>;
    }
    return null;
  }

  return (
    <footer className="bg-slate-900 overflow-hidden py-24 pb-12 text-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="max-w-70">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="152 220 710 215"
                className="h-12 w-auto text-white fill-current"
              >
                <path d="M194.478302,411.482117C188.648972,398.666321 181.184067,387.211884 174.078979,375.556946C161.946335,355.654999 154.218430,334.429535 152.466766,310.927032C150.965759,290.787415 151.490814,271.069061 158.657028,251.953415C161.906097,243.286591 167.372574,236.333282 175.068100,231.098938C187.972153,222.321823 212.377777,222.515015 222.031631,242.165817C226.003326,250.250381 232.154404,254.994858 241.386230,255.103607C240.874603,257.700470 239.210571,257.303253 238.057617,257.539734C214.604111,262.350281 200.098267,276.975067 192.363480,299.065857C184.921768,320.319672 187.555267,352.132874 198.628662,372.172211C195.346085,360.736084 194.548477,349.072571 194.585556,337.231354C194.686203,305.091156 209.071442,282.030487 237.587112,267.388245C252.463837,259.749298 268.363953,254.738281 283.791870,248.515182C300.024750,241.967392 315.867065,234.607849 330.889893,225.571030C331.848022,224.994675 332.727417,224.133804 334.330139,224.642090C334.086884,229.016586 332.356110,232.995224 331.110291,237.029678C325.877838,253.974487 319.356995,270.258270 307.731262,284.109070C295.584656,298.580475 279.797791,306.307983 261.751282,310.259583C255.743668,311.575104 249.729248,312.898682 243.795959,314.506500C229.390137,318.410126 220.388382,329.212219 218.286926,343.947327C216.575470,355.947906 217.905655,367.798737 218.737152,379.737518C219.623474,392.463135 221.756760,405.206818 219.303925,418.003387C217.963852,424.994537 214.710114,430.344635 207.688766,433.006439C204.303909,434.289673 202.544754,433.679260 201.368622,430.074707C199.358749,423.914886 196.908096,417.898895 194.478302,411.482117z"></path>
                <path d="M347.022308,320.000671C347.016052,314.839264 347.105347,310.174835 346.965759,305.517273C346.865234,302.162506 348.128204,300.629364 351.628418,300.734467C356.786560,300.889313 361.960175,300.922363 367.113922,300.699646C370.973633,300.532806 372.427643,301.928192 372.368347,305.879303C372.186157,318.023376 372.301971,330.171936 372.301971,342.083649C373.283447,342.867767 373.819183,342.426117 374.318726,342.006836C383.782745,334.063324 394.575775,332.615875 406.196838,335.633057C415.899536,338.152130 422.744904,346.587646 423.310516,356.622040C424.267090,373.593201 423.737030,390.584991 423.953217,407.566589C423.995270,410.868988 423.022247,412.495087 419.405853,412.347473C414.084778,412.130249 408.740967,412.096069 403.421997,412.329346C399.633331,412.495514 398.561127,410.970825 398.606415,407.354187C398.766998,394.531891 398.675171,381.706299 398.663269,368.881958C398.653717,358.575378 395.399567,354.366302 387.286011,354.116821C377.843262,353.826508 372.628845,358.719452 372.391693,368.828339C372.122253,380.313904 372.349670,391.810638 372.318054,403.302399C372.289795,413.578827 373.113983,412.175079 363.109467,412.274994C359.445770,412.311584 355.772827,412.113037 352.119568,412.309662C348.129639,412.524414 346.894379,410.660309 346.908722,406.924530C346.998840,383.444702 346.970551,359.964386 346.985443,336.484253C346.988831,331.156372 347.007996,325.828522 347.022308,320.000671z"></path>
                <path d="M320.909363,412.311096C317.090668,412.315186 313.737823,412.059113 310.437317,412.365967C305.318787,412.841858 301.746216,411.882538 302.918549,404.615967C295.871124,410.791656 288.552673,413.763123 280.156006,414.249451C254.958969,415.708740 237.504608,396.636383 239.498611,370.735535C239.781265,367.064178 240.334641,363.492889 241.348862,359.967224C249.310272,332.292297 281.741791,328.266632 299.022125,340.520233C300.048828,341.248291 300.767242,342.583801 302.297913,342.519531C303.777649,335.660950 303.777649,335.661041 311.217407,335.661530C315.046356,335.661774 318.896240,335.913361 322.698822,335.596771C327.228424,335.219635 328.372986,337.188049 328.342041,341.407928C328.185883,362.715698 328.266510,384.025238 328.261688,405.334137C328.260132,412.186127 328.256805,412.186127 320.909363,412.311096M301.669952,365.008423C295.854095,354.320007 283.816345,350.650452 274.124878,356.611633C264.651733,362.438538 261.929047,377.159515 268.562775,386.684814C274.734344,395.546509 288.041443,397.276093 296.853241,389.902008C304.682800,383.349915 304.819550,374.753296 301.669952,365.008423z"></path>
                <path d="M605.060913,373.000000C605.062988,384.657990 604.973816,395.817139 605.115417,406.973328C605.163574,410.764404 603.888367,412.517792 599.916382,412.297821C596.098145,412.086365 592.258423,412.278320 588.428223,412.263885C581.340210,412.237213 581.340271,412.228333 580.396484,405.534912C578.652649,405.182587 577.723206,406.577301 576.587097,407.410583C564.256653,416.454071 551.032898,416.485992 537.883057,410.164795C525.372864,404.151062 519.815430,393.082336 518.661011,379.565979C517.650513,367.735138 519.446167,356.688538 527.285583,347.204102C539.560242,332.353760 562.272705,329.781647 577.620483,341.553528C578.269348,342.051208 578.930420,342.532898 579.531860,342.981750C579.975769,342.721405 580.485229,342.552582 580.478455,342.407898C580.185974,336.163940 583.752686,335.041809 589.019958,335.614197C592.147156,335.954010 595.341675,335.664795 598.505798,335.677979C604.895813,335.704559 605.023010,335.813751 605.037109,342.023712C605.060242,352.182434 605.053894,362.341248 605.060913,373.000000M560.688660,354.010437C551.697937,354.960571 545.673096,359.988037 543.586243,368.281647C541.270569,377.484711 544.135803,386.858582 550.601074,391.231262C557.524597,395.913879 567.137268,395.721375 574.094788,390.760834C580.548767,386.159302 583.183777,376.489594 580.517395,367.191528C578.133301,358.877991 571.864624,354.512573 560.688660,354.010437z"></path>
                <path d="M791.203979,365.000000C791.216858,379.151947 791.068298,392.806946 791.330078,406.454102C791.419312,411.109009 789.796753,412.746704 785.268616,412.344116C781.965149,412.050415 778.614258,412.285797 775.284485,412.293915C768.156677,412.311279 768.156677,412.313538 767.357422,405.215393C764.213135,407.193054 761.370483,409.448242 758.167908,410.920929C733.721130,422.162598 707.000671,405.737396 705.710083,378.830902C705.135010,366.839264 706.926270,355.504913 715.175415,346.176605C727.394165,332.359222 748.536804,330.064270 763.725403,340.652008C764.770203,341.380341 765.547607,342.627289 767.044250,342.615326C768.603943,335.673187 768.603943,335.673187 776.271057,335.669495C791.293762,335.662231 791.290283,335.662231 791.225891,350.515137C791.205688,355.176697 791.210022,359.838379 791.203979,365.000000M768.573364,376.996460C769.015320,373.435791 768.214661,370.040833 767.117615,366.707123C764.123230,357.607910 755.689209,352.825104 745.305481,354.289215C737.101746,355.445923 731.056091,363.018951 730.341125,373.034027C729.616272,383.187927 734.786743,391.471527 743.217041,393.662537C755.729126,396.914307 764.723938,391.261047 768.573364,376.996460z"></path>
                <path d="M697.327026,399.984680C697.339050,412.311646 697.339050,412.311615 685.404663,412.283051C670.974670,412.248474 670.964172,412.248535 670.934204,397.847595C670.912354,387.349304 670.950134,376.850830 670.910339,366.352631C670.877319,357.649750 667.768311,354.120880 660.178406,354.030457C651.960327,353.932495 646.475220,358.640869 646.328003,366.479462C646.090149,379.139923 646.175232,391.806488 646.130127,404.470490C646.102478,412.239929 646.107666,412.248108 638.147339,412.267700C633.814819,412.278351 629.479553,412.159454 625.150574,412.280670C622.015259,412.368408 620.641907,411.190186 620.652283,407.922607C620.723999,385.259857 620.724670,362.596588 620.651917,339.933838C620.641296,336.624023 622.086670,335.543457 625.194092,335.645996C629.355530,335.783325 633.524902,335.671936 637.690918,335.677185C645.251038,335.686707 645.251038,335.689728 646.772644,342.860565C652.933044,338.273254 659.430969,334.844513 667.182312,334.359741C685.805542,333.194977 696.572632,343.763824 697.123047,358.999908C697.610107,372.480835 697.291077,385.990845 697.327026,399.984680z"></path>
                <path d="M462.865234,349.315674C466.810211,360.099579 470.616516,370.517090 474.916962,382.287018C479.384949,370.264709 483.446716,359.611023 487.304840,348.884125C492.050720,335.688873 491.977295,335.663025 505.813934,335.672577C509.450104,335.675079 513.086243,335.672974 516.388855,335.672974C517.832825,337.670685 516.935730,339.029816 516.375854,340.352936C506.968994,362.584229 497.464996,384.774902 488.184998,407.058929C486.539337,411.010712 484.388458,412.776581 479.977966,412.379303C475.350067,411.962463 470.655884,412.190247 465.993652,412.284424C463.688049,412.331024 462.271484,411.462463 461.363007,409.333313C451.367401,385.906311 441.325592,362.499023 431.328247,339.072754C431.024841,338.361816 431.069000,337.502533 430.862396,336.117645C439.559174,335.296478 447.964783,335.637482 456.359894,335.899841C458.206085,335.957550 458.559937,337.773163 459.088776,339.116821C460.368408,342.367920 461.522064,345.668579 462.865234,349.315674z"></path>
              </svg>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simplifying immigration journeys with guidance, tools, and expert
              support. Your path to reuniting with loved ones starts here.
            </p>
          </div>

          {/* Journeys Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Journeys
            </h4>
            <nav className="flex flex-col gap-4 text-sm">
              <Link
                href="/visa-category/ir-category?category=Family"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Family & Protection
              </Link>
              <Link
                href="/visa-category/ir-category?category=Work"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Work & Business
              </Link>
              <Link
                href="/visa-category/ir-category?category=Work"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Work Green Cards
              </Link>
              <Link
                href="/visa-category/ir-category?category=Study"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Students & Visitors
              </Link>
              <Link
                href="/visa-category/ir-category"
                className="text-white font-medium underline hover:text-slate-200 transition-colors"
              >
                Explore all Journeys
                <ArrowRight size={14} className="inline-block ml-1" />
              </Link>
            </nav>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Tools
            </h4>
            <nav className="flex flex-col gap-4 text-sm">
              <Link
                href="/visa-case-strength-checker"
                className="text-slate-400 hover:text-white transition-colors"
              >
                CasePulse AI
              </Link>
              <Link
                href="/visa-eligibility"
                className="text-slate-400 hover:text-white transition-colors"
              >
                VisaPath Finder
              </Link>
              <Link
                href="/affidavit-support-calculator"
                className="text-slate-400 hover:text-white transition-colors"
              >
                SponsorReady
              </Link>
              <Link
                href="/pdf-processing"
                className="text-slate-400 hover:text-white transition-colors"
              >
                PDF PowerKit
              </Link>
              <Link
                href="/tools"
                className="text-white font-medium underline hover:text-slate-200 transition-colors"
              >
                Explore all Tools
                <ArrowRight size={14} className="inline-block ml-1" />
              </Link>
            </nav>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Company
            </h4>
            <nav className="flex flex-col gap-4 text-sm">
              <Link
                href="/#about"
                onClick={(e) => handleNav("about", e)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/#contact"
                onClick={(e) => handleNav("contact", e)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Social Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Connect With Us
            </h4>
            <nav className="flex flex-col gap-4 text-sm">
              <Link
                href="https://www.instagram.com/rahvana.co?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <Instagram
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                Instagram
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=61587967827317&mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <Facebook
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                Facebook
              </Link>
              <Link
                href="https://x.com/rahvanaco?s=21&t=a8CQwdRgHqBFZmUfsX8Gpg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4.5 w-4.5 fill-current group-hover:scale-110 transition-transform"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
                X
              </Link>
              <Link
                href="#"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <Linkedin
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                LinkedIn
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <p>© {2026} Rahvana. All rights reserved.</p>
          <div className="flex gap-8">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault(); // Stop browser jump
                setComingSoonOpen(true);
              }}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault(); // Stop browser jump
                setComingSoonOpen(true);
              }}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault(); // Stop browser jump
                setComingSoonOpen(true);
              }}
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>

      <ComingSoonModal open={comingSoonOpen} onOpenChange={setComingSoonOpen} />
    </footer>
  );
}
