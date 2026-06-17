"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { registerGuard } from "./navigationGuardStore";

interface NavigationGuardProps {
  shouldBlock: boolean;
  onSave: () => Promise<void>;
  navigationHandled: boolean;
  setNavigationHandled: (val: boolean) => void;
}

export function NavigationGuard({
  shouldBlock,
  onSave,
  navigationHandled,
  setNavigationHandled,
}: NavigationGuardProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Register with the shared navigation guard store so the SiteHeader
  // (and any other component using router.push) can check before navigating.
  useEffect(() => {
    if (shouldBlock && !navigationHandled) {
      registerGuard({
        shouldBlock: true,
        onRequestNavigation: (href: string) => {
          setPendingHref(href);
          setShowModal(true);
        },
      });
    } else {
      registerGuard(null);
    }
    return () => registerGuard(null);
  }, [shouldBlock, navigationHandled]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link || !shouldBlock || navigationHandled) return;

      e.preventDefault();
      const href = link.getAttribute("href") || "/";

      setPendingHref(href);
      setShowModal(true);
    },
    [shouldBlock, navigationHandled]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  const handleSaveAndLeave = async () => {
    setSaving(true);
    try {
      await onSave();
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
    setNavigationHandled(true);
    registerGuard(null);
    setShowModal(false);
    if (pendingHref) router.push(pendingHref);
  };

  const handleLeaveWithoutSaving = () => {
    setNavigationHandled(true);
    registerGuard(null);
    setShowModal(false);
    if (pendingHref) router.push(pendingHref);
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingHref(null);
  };

  return (
    <ConfirmationModal
      open={showModal}
      onOpenChange={(open: boolean) => {
        if (!open) handleCancel();
      }}
      title="Unsaved Progress"
      description="You have unsaved progress. Do you want to save this guide before leaving?"
      cancelText="Leave without saving"
      confirmText="Save & Leave"
      confirmVariant="primary"
      onConfirm={handleSaveAndLeave}
      onCancel={handleLeaveWithoutSaving}
      loading={saving}
    />
  );
}

/** @deprecated Use NavigationGuard component instead */
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

      setNavigationHandled(true);

      if (confirmLeave) {
        await onSave();
      }

      router.push(href);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [shouldBlock, onSave, navigationHandled, setNavigationHandled, router]);
}
