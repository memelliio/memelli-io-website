'use client';

import { useWorkspaceStore } from '@/stores/workspace';
import { useCallback } from 'react';

export function useWorkspacePanel() {
  const {
    selectedRecord,
    panelOpen,
    panelWidth,
    panelStack,
    selectRecord,
    openPanel,
    closePanel,
    pushPanel,
    popPanel,
  } = useWorkspaceStore();

  /** Select a record and open the slide panel */
  const openRecord = useCallback(
    (
      id: string,
      type: string,
      data?: any,
      width?: 'sm' | 'md' | 'lg' | 'xl'
    ) => {
      selectRecord({ id, type, data });
      if (width) openPanel(width);
    },
    [selectRecord, openPanel]
  );

  /** Clear the selection and close the panel */
  const closeRecord = useCallback(() => {
    closePanel();
  }, [closePanel]);

  /** Push a nested panel onto the stack (drill-in navigation) */
  const pushNested = useCallback(
    (id: string, type: string, data?: any) => {
      pushPanel({ id, type, data });
    },
    [pushPanel]
  );

  /** Pop the top panel off the stack (go back) */
  const popNested = useCallback(() => {
    popPanel();
  }, [popPanel]);

  const isOpen = panelOpen;
  const hasNested = panelStack.length > 1;

  return {
    openRecord,
    closeRecord,
    isOpen,
    selectedRecord,
    panelWidth,
    pushNested,
    popNested,
    hasNested,
  };
}
