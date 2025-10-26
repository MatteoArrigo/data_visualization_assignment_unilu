# Scatterplot Brush Selection Sequence Diagram

This diagram shows the complete flow of callbacks and state updates when a user performs a 2D brush selection in the scatterplot.

```mermaid
sequenceDiagram
    actor User
    participant ScatterplotD3
    participant ScatterplotContainer
    participant App
    participant PCPContainer
    participant ParallelCoordinatesD3

    User->>ScatterplotD3: Drag to create brush selection
    
    Note over ScatterplotD3: Brush event only on "start"

    ScatterplotD3->>ScatterplotContainer: controllerMethods.clearOtherBrushes()
    ScatterplotContainer->>App: scatterplotControllerMethods.clearParallelCoordinatesBrushes()
    
    Note over App: Call parallelCoordinatesClearBrushRef.current()
    
    App->>PCPContainer: Invoke via clearBrushRef
    PCPContainer->>ParallelCoordinatesD3: clearAllBrushes()
    
    Note over ParallelCoordinatesD3: Clear all brush ranges<br/>Call brush.move(null) on all axes
    
    ParallelCoordinatesD3-->>PCPContainer: Brushes cleared
    PCPContainer-->>App: Done

    ScatterplotD3->>ScatterplotD3: Get selected items in brush extent

    Note over ScatterplotD3: for all brush event

    ScatterplotD3->>ScatterplotContainer: controllerMethods.handleBrushSelection(selectedItems)
    ScatterplotContainer->>App: scatterplotControllerMethods.updateSelectedItems(items)
    
    Note over App: Call setSelectedItems(items)
    
    App->>App: State update: selectedItems changed
    
    Note over App: React re-render triggered
    
    App->>ScatterplotContainer: Pass selectedItems as prop
    App->>PCPContainer: Pass selectedItems as prop
    
    Note over ScatterplotContainer: useEffect([selectedItems]) triggered
    
    ScatterplotContainer->>ScatterplotD3: highlightSelectedItems(selectedItems)
    ScatterplotD3->>ScatterplotD3: Update visual styling (opacity, stroke)
    ScatterplotD3-->>User: Visual feedback: selected points highlighted
    
    Note over PCPContainer: useEffect([selectedItems]) triggered
    
    PCPContainer->>ParallelCoordinatesD3: highlightSelectedItems(selectedItems)
    ParallelCoordinatesD3->>ParallelCoordinatesD3: Update line classes (add 'selected')<br/>Raise selected lines to front
    ParallelCoordinatesD3-->>User: Visual feedback: corresponding lines highlighted
```

## Key Points

1. **Brush event initiation**: User interaction in ScatterplotD3 triggers D3's brush event handler
2. **Cross-view brush clearing**: Scatterplot clears PCP brushes via controllerMethods → App's ref
3. **Ref-based communication**: App uses `useRef` to access each container's clear brush function
4. **Selection update**: Selected items are passed to App component via controller methods
5. **State propagation**: React's `setSelectedItems()` triggers re-render with new props
6. **useEffect hooks**: Both containers detect `selectedItems` change and update their D3 visualizations
7. **Bidirectional highlighting**: Both views show visual feedback simultaneously

## Flow Summary

```
User Drag → D3 Brush Event → Clear Other View (via ref) → Update Selection State → 
React Re-render → Props Update → useEffect Triggers → D3 Visual Updates
```
