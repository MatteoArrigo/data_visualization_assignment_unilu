import './ParallelCoordinates.css'
import {useEffect, useRef, useImperativeHandle, forwardRef} from 'react';

import ParallelCoordinatesD3 from './ParallelCoordinates-d3';

const ParallelCoordinatesContainer = forwardRef(({parallelCoordinatesData, selectedItems, parallelCoordinatesControllerMethods, numAxes}, ref) => {

    // every time the component re-render
    useEffect(()=>{
        // console.log("ParallelCoordinatesContainer useEffect (called each time component re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    const divContainerRef = useRef(null);
    const parallelCoordinatesD3Ref = useRef(null)
    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        clearAllBrushes: () => {
            const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
            if (parallelCoordinatesD3) {
                parallelCoordinatesD3.clearAllBrushes();
            }
        }
    }));

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

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("ParallelCoordinatesContainer useEffect [] called once the component did mount");
        const parallelCoordinatesD3 = new ParallelCoordinatesD3(divContainerRef.current);
        parallelCoordinatesD3.create({size: getChartSize()});
        parallelCoordinatesD3Ref.current = parallelCoordinatesD3;
        return ()=>{
            // did unmount, the return function is called once the component did unmount (removed from the screen)
            console.log("ParallelCoordinatesContainer useEffect [] return function, called when the component did unmount...");
            const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
            parallelCoordinatesD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)


    const parallelCoordinatesDataRef = useRef(parallelCoordinatesData);
    // did update, called each time dependencies change
    useEffect(()=>{
        console.log("ParallelCoordinatesContainer useEffect with dependency [parallelCoordinatesData, parallelCoordinatesControllerMethods], called each time any dependency changes...");

        const handleOnClick = function(itemData){
            console.log("handleOnClick in parallel coordinates...")
            parallelCoordinatesControllerMethods.updateSelectedItems([itemData])
        }
        const handleOnMouseEnter = function(itemData){
        }
        const handleOnMouseLeave = function(){
        }
        const getSelectedItems = function(){
            return selectedItems;
        }
        const handleBrushSelection = function(selectedItems){
            console.log("handleBrushSelection in parallel coordinates with", selectedItems.length, "items")
            parallelCoordinatesControllerMethods.updateSelectedItems(selectedItems)
        }
        const clearOtherBrushes = function(){
            console.log("clearOtherBrushes called from parallel coordinates")
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
            console.log("ParallelCoordinatesContainer useEffect with dependency when parallelCoordinatesData changes...");
            // get the current instance of parallelCoordinatesD3 from the Ref object...
            const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current
            // call renderParallelCoordinates of ParallelCoordinatesD3...;
            parallelCoordinatesD3.renderParallelCoordinates(parallelCoordinatesData, controllerMethods);
            parallelCoordinatesDataRef.current = parallelCoordinatesData;
        }
    },[parallelCoordinatesData, parallelCoordinatesControllerMethods, selectedItems]);// if dependencies, useEffect is called after each data update

    // Handle numAxes changes
    useEffect(() => {
        console.log("ParallelCoordinatesContainer useEffect with dependency [numAxes], called when numAxes changes...");
        const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current;
        if (parallelCoordinatesD3 && parallelCoordinatesData.length > 0) {
            parallelCoordinatesD3.updateAxesCount(numAxes);
        }
    }, [numAxes, parallelCoordinatesData]);

    useEffect(()=>{
        console.log("ParallelCoordinatesContainer useEffect with dependency [selectedItems]," +
            "called each time selectedItems changes...");
        // get the current instance of parallelCoordinatesD3 from the Ref object...
        const parallelCoordinatesD3 = parallelCoordinatesD3Ref.current
        // call highlightSelectedItems of ParallelCoordinatesD3...;
        if (parallelCoordinatesD3) {
            parallelCoordinatesD3.highlightSelectedItems(selectedItems)
        }
    },[selectedItems])

    return(
        <div ref={divContainerRef} className="parallelCoordinatesDivContainer col-60">
        </div>
    )
});

export default ParallelCoordinatesContainer;
