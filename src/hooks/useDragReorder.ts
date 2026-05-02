```typescript
import { useState, useRef, useEffect } from 'react';

interface DragItem<T> {
  item: T;
  index: number;
  dragging: boolean;
}

export function useDragReorder<T>(items: T[], onReorder: (newOrder: T[]) => void) {
  const [dragItem, setDragItem] = useState<DragItem<T> | null>(null);
  const [itemsState, setItemsState] = useState(items);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItemsState(items);
  }, [items]);

  const handleMouseDown = (event: MouseEvent, index: number) => {
    event.preventDefault();
    const item = itemsState[index];
    setDragItem({ item, index, dragging: true });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!dragItem) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const column = Math.round(x / (rect.width / 4));
    const newIndex = Math.min(Math.max(column, 0), itemsState.length - 1);
    if (newIndex !== dragItem.index) {
      const newItems = [...itemsState];
      const item = newItems.splice(dragItem.index, 1)[0];
      newItems.splice(newIndex, 0, item);
      setItemsState(newItems);
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!dragItem) return;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setDragItem({ ...dragItem, dragging: false });
    onReorder(itemsState);
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (!dragItem) return;
    const newItems = [...itemsState];
    const item = newItems.splice(dragItem.index, 1)[0];
    newItems.splice(index, 0, item);
    setItemsState(newItems);
  };

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (!dragItem) return;
    onReorder(itemsState);
  };

  return {
    items: itemsState,
    containerRef,
    handleMouseDown,
    handleDragOver,
    handleDrop,
    dragItem,
  };
}
```