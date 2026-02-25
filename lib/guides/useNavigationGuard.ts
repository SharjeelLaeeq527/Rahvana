import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useNavigationGuard(
  shouldBlock: boolean,
  onSave: () => Promise<void>,
  navigationHandled: boolean,
  setNavigationHandled: (val: boolean) => void
) {
  const router = useRouter();

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link || !shouldBlock || navigationHandled) return;

      e.preventDefault();
      const href = link.getAttribute("href") || "/";

      const confirmLeave = window.confirm(
        "You have unsaved progress. Do you want to save this guide before leaving?"
      );

      setNavigationHandled(true); // mark that we handled navigation

      if (confirmLeave) {
        await onSave(); // wait for save to finish
      }

      router.push(href);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [shouldBlock, onSave, navigationHandled, setNavigationHandled, router]);
}