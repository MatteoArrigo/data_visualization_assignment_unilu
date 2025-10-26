import './ParallelCoordinates.css'
import {useEffect, useRef} from 'react';

import ParallelCoordinatesD3 from './ParallelCoordinates-d3';

const ParallelCoordinatesContainer = ({parallelCoordinatesData, selectedItems, parallelCoordinatesControllerMethods, numAxes, onClearBrushRequested}) => {

    // every time the component re-render
    useEffect(()=>{
        console.log("[PARALLEL COORDINATES CONTAINER] useEffect (called each time component re-renders)");
    });

    const divContainerRef = useRef(null);
    const parallelCoordinatesD3Ref = useRef(null);
    const parallelCoordinatesDataRef = useRef(parallelCoordinatesData);

    const getChartSize = function(){
        // getting size from parent item
        let width;
        let height;
        if(divContainerRef.current !== undefined){
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight - 4;
        }
        return {width: width, height: height};
    }

    // Initial setup, called only once the component did mount
    // Creates reference for parallelCoordinatesD3
    useEffect(()=>{
        console.log("[PARALLEL COORDINATES CONTAINER] (component did mount) creation of ParallelCoordinatesD3 instance...");
        const parallelCoordinatesD3 = new ParallelCoordinatesD3(divContainerRef.current);
        parallelCoordinatesD3.create({size: getChartSize()});
        parallelCoordinatesD3Ref.current = parallelCoordinatesD3;
        return ()=>{
            // did unmount, the return function is called once the component did unmount (removed from the screen)
            console.log("[PARALLEL COORDINATES CONTAINER] useEffect [] return function, called when the component did unmount...");
            const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
            parallelCoordinatesD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // Update parallel coordinates when data or attributes change
    useEffect(()=>{
        console.log("[PARALLEL COORDINATES CONTAINER] update parallel coordinates when data or attributes change...");

        const handleOnClick = function(itemData){
            console.log("[PARALLEL COORDINATES CONTAINER] handleOnClick in parallel coordinates...")
            parallelCoordinatesControllerMethods.updateSelectedItems([itemData])
        }
        const handleOnMouseEnter = function(itemData){}
        const handleOnMouseLeave = function(){}
        const getSelectedItems = function(){
            return selectedItems;
        }
        const handleBrushSelection = function(selectedItems){
            console.log("[PARALLEL COORDINATES CONTAINER] handleBrushSelection in parallel coordinates with", selectedItems.length, "items")
            parallelCoordinatesControllerMethods.updateSelectedItems(selectedItems)
        }
        const clearOtherBrushes = function(){
            console.log("[PARALLEL COORDINATES CONTAINER] clearOtherBrushes called from parallel coordinates")
            if (parallelCoordinatesControllerMethods.clearScatterplotBrush) {
                parallelCoordinatesControllerMethods.clearScatterplotBrush();
            }
        }

        const updateSelectedItems = function(items){
            parallelCoordinatesControllerMethods.updateSelectedItems(items)
        }

        const controllerMethods = {
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave,
            getSelectedItems,
            handleBrushSelection,
            clearOtherBrushes,
            updateSelectedItems
        }

        if(parallelCoordinatesDataRef.current !== parallelCoordinatesData) {
            // Re-render parallel coordinates only if data actually changed
            console.log("[PARALLEL COORDINATES CONTAINER] useEffect with dependency when parallelCoordinatesData changes...");
            const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current
            parallelCoordinatesD3.renderParallelCoordinates(parallelCoordinatesData, controllerMethods);
            parallelCoordinatesDataRef.current = parallelCoordinatesData;
        }
    },[parallelCoordinatesData, parallelCoordinatesControllerMethods, selectedItems]);

    // Handle numAxes changes
    useEffect(() => {
        console.log("[PARALLEL COORDINATES CONTAINER] useEffect with dependency [numAxes], called when numAxes changes...");
        const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
        if (parallelCoordinatesD3 && parallelCoordinatesData.length > 0) {
            parallelCoordinatesD3.updateAxesCount(numAxes);
        }
    }, [numAxes, parallelCoordinatesData]);

    // Update highlighted items when selectedItems changes
    useEffect(() => {
        console.log("[PARALLEL COORDINATES CONTAINER] update highlighted items when selectedItems changes...");
        const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current
        if (parallelCoordinatesD3) {
            parallelCoordinatesD3.highlightSelectedItems(selectedItems)
        }
    }, [selectedItems])

    // Handle external clear brush request
    useEffect(() => {
        if (onClearBrushRequested) {
            onClearBrushRequested(() => {
                const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
                if (parallelCoordinatesD3) {
                    parallelCoordinatesD3.clearAllBrushes();
                }
            });
        }
    }, [onClearBrushRequested]);

    return(
        <div ref={divContainerRef} className="parallelCoordinatesDivContainer col-60">
        </div>
    )
};

export default ParallelCoordinatesContainer;
